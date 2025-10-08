interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// Utility functions for debouncing and throttling
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (options.trailing) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), 0);
        }
      }, limit);
    }
  };
}

interface QueuedRequest {
  key: string;
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  priority: number;
  timestamp: number;
}

class RequestManager {
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = new Set<string>();
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxConcurrentRequests = 6; // Limit concurrent requests
  private activeRequestCount = 0;
  private processingQueue = false;

  // Debounced functions for different types of requests
  private debouncedSettingsUpdate = debounce(this.executeSettingsUpdate.bind(this), 500);
  private throttledRefresh = throttle(this.executeRefresh.bind(this), 2000, { trailing: true });

  /**
   * Add a request to the queue with priority
   */
  async queueRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    priority: number = 1,
    _options: RequestOptions = {} // Prefixed with underscore to indicate intentionally unused
  ): Promise<T> {
    // Check cache first
    const cached = this.getCachedData<T>(key);
    if (cached) {
      return cached;
    }

    // Check if request is already in progress
    if (this.activeRequests.has(key)) {
      // Return existing promise for the same request
      return new Promise<T>((resolve, reject) => {
        const existingRequest = this.requestQueue.find(req => req.key === key);
        if (existingRequest) {
          // Replace with higher priority if needed
          if (priority > existingRequest.priority) {
            existingRequest.priority = priority;
          }
          // Wait for existing request
          setTimeout(() => {
            const result = this.getCachedData<T>(key);
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Request failed or timed out'));
            }
          }, 100);
        }
      });
    }

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        key,
        fn: requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      this.sortQueueByPriority();
      this.processQueue();
    });
  }

  /**
   * Batch multiple requests with the same priority
   */
  async batchRequests<T>(
    requests: Array<{ key: string; fn: () => Promise<T>; priority?: number }>,
    batchSize: number = 3
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(req => 
        this.queueRequest(req.key, req.fn, req.priority || 1)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch request failed for ${batch[index].key}:`, result.reason);
          results.push(null as any);
        }
      });
      
      // Add small delay between batches to prevent overwhelming the server
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Debounced settings update
   */
  debouncedUpdateSetting(key: string, value: any, updateFn: (key: string, value: any) => Promise<any>) {
    this.debouncedSettingsUpdate(key, value, updateFn);
  }

  /**
   * Throttled refresh for global settings
   */
  throttledGlobalRefresh(refreshFn: () => Promise<any>) {
    this.throttledRefresh(refreshFn);
  }

  /**
   * Cancel all pending requests for a specific key
   */
  cancelRequests(keyPattern: string) {
    this.requestQueue = this.requestQueue.filter(req => {
      if (req.key.includes(keyPattern)) {
        req.reject(new Error('Request cancelled'));
        return false;
      }
      return true;
    });
  }

  /**
   * Clear cache for a specific key or pattern
   */
  clearCache(keyPattern?: string) {
    if (keyPattern) {
      for (const key of this.requestCache.keys()) {
        if (key.includes(keyPattern)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * Set cache with TTL
   */
  setCachedData<T>(key: string, data: T, ttl: number = 300000) { // 5 minutes default
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached data if still valid
   */
  getCachedData<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.requestCache.delete(key);
    }
    return null;
  }

  private async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequestCount < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();
      if (!request) break;

      this.activeRequests.add(request.key);
      this.activeRequestCount++;

      this.executeRequest(request);
    }

    this.processingQueue = false;
  }

  private async executeRequest(request: QueuedRequest) {
    try {
      const result = await request.fn();
      this.setCachedData(request.key, result);
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeRequests.delete(request.key);
      this.activeRequestCount--;
      
      // Process next requests in queue
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50);
      }
    }
  }

  private sortQueueByPriority() {
    this.requestQueue.sort((a, b) => {
      // Higher priority first, then older requests first
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });
  }

  private async executeSettingsUpdate(key: string, value: any, updateFn: (key: string, value: any) => Promise<any>) {
    try {
      await updateFn(key, value);
    } catch (error) {
      console.error('Settings update failed:', error);
    }
  }

  private async executeRefresh(refreshFn: () => Promise<any>) {
    try {
      await refreshFn();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequestCount,
      cacheSize: this.requestCache.size
    };
  }
}

export const requestManager = new RequestManager();
export default requestManager;