/**
 * Migration guide and utilities for transitioning to optimized API management
 * 
 * This file helps developers understand how to update their components
 * to use the new optimized API patterns.
 */

// Example of updating a component to use optimized patterns

/* BEFORE - Multiple uncontrolled API calls:

import { useQuery } from '@tanstack/react-query';
import { configApi } from '@/services/configApi';

export function MyComponent() {
  const { data: config } = useQuery(['config'], configApi.getAppConfig);
  const { data: permissions } = useQuery(['permissions'], configApi.getPermissions);
  const { data: roles } = useQuery(['roles'], configApi.getRoles);
  const { data: navigation } = useQuery(['navigation'], configApi.getNavigation);
  const { data: features } = useQuery(['features'], configApi.getFeatureFlags);
  const { data: themes } = useQuery(['themes'], configApi.getThemes);
  
  // This creates 6 simultaneous API calls that can overwhelm the backend
  
  return <div>My Component</div>;
}
*/

/* AFTER - Using optimized initialization:

import { useOptimizedAppInitialization } from '@/hooks/useOptimizedAppInitialization';

export function MyComponent() {
  const { isLoading, isInitialized, error, progress } = useOptimizedAppInitialization();
  
  // This batches and prioritizes API calls, preventing backend overload
  
  if (isLoading) {
    return <div>Loading... {progress}%</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return <div>My Component</div>;
}
*/

// Migration checklist for components:

export const MIGRATION_CHECKLIST = {
  // 1. Replace multiple individual useQuery calls with batch initialization
  hooks: {
    before: 'Multiple useQuery calls in single component',
    after: 'Use useOptimizedAppInitialization or batch requests'
  },
  
  // 2. Update API service imports
  apiService: {
    before: 'import apiService from "@/services/apiService"',
    after: 'import optimizedApiService from "@/services/optimizedApiService"'
  },
  
  // 3. Update settings watchers
  settingsWatcher: {
    before: 'useGlobalSettingsWatcher',
    after: 'useOptimizedGlobalSettingsWatcher'
  },
  
  // 4. Update components with heavy API usage
  components: {
    before: 'DynamicSettingsManager',
    after: 'OptimizedDynamicSettingsManager'
  },
  
  // 5. Add request priorities for critical operations
  priorities: {
    critical: 'priority: 10 (auth, critical saves)',
    high: 'priority: 8-9 (updates, deletes)',
    normal: 'priority: 5-7 (normal operations)',
    low: 'priority: 1-4 (background, analytics)'
  }
};

// Helper function to gradually migrate API calls
export function createMigrationWrapper<T>(
  legacyCall: () => Promise<T>,
  optimizedCall: () => Promise<T>,
  useOptimized = process.env.NODE_ENV === 'development'
): () => Promise<T> {
  return async () => {
    try {
      if (useOptimized) {
        return await optimizedCall();
      } else {
        return await legacyCall();
      }
    } catch (error) {
      console.warn('API call failed, trying fallback:', error);
      // Fallback to legacy if optimized fails
      return useOptimized ? await legacyCall() : await optimizedCall();
    }
  };
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  
  static startMeasurement(key: string): () => void {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (!this.measurements.has(key)) {
        this.measurements.set(key, []);
      }
      
      const measurements = this.measurements.get(key)!;
      measurements.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.length > 100) {
        measurements.shift();
      }
      
      // Log slow operations
      if (duration > 1000) { // Slower than 1 second
        console.warn(`Slow operation detected: ${key} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  static getStats(key: string) {
    const measurements = this.measurements.get(key) || [];
    if (measurements.length === 0) return null;
    
    const sorted = [...measurements].sort((a, b) => a - b);
    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    
    return {
      count: measurements.length,
      average: avg.toFixed(2),
      median: median.toFixed(2),
      p95: p95.toFixed(2),
      min: sorted[0].toFixed(2),
      max: sorted[sorted.length - 1].toFixed(2)
    };
  }
  
  static getAllStats() {
    const stats: Record<string, any> = {};
    for (const key of this.measurements.keys()) {
      stats[key] = this.getStats(key);
    }
    return stats;
  }
  
  static reset() {
    this.measurements.clear();
  }
}

// Usage example for performance monitoring:
/*
const endMeasurement = PerformanceMonitor.startMeasurement('api-call-settings');
try {
  const result = await configApi.getSettings();
  endMeasurement();
  return result;
} catch (error) {
  endMeasurement();
  throw error;
}
*/

// Development helper to track API request patterns
export class RequestPatternAnalyzer {
  private static requests: Array<{
    url: string;
    method: string;
    timestamp: number;
    duration?: number;
  }> = [];
  
  static logRequest(url: string, method: string, duration?: number) {
    this.requests.push({
      url,
      method,
      timestamp: Date.now(),
      duration
    });
    
    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests.shift();
    }
  }
  
  static detectPatterns() {
    const now = Date.now();
    const last5Minutes = this.requests.filter(req => now - req.timestamp < 5 * 60 * 1000);
    
    // Detect burst patterns
    const bursts = this.detectBursts(last5Minutes, 1000); // 1 second windows
    
    // Detect repeated requests
    const repeated = this.detectRepeatedRequests(last5Minutes);
    
    // Detect slow requests
    const slowRequests = last5Minutes.filter(req => req.duration && req.duration > 2000);
    
    return {
      totalRequests: last5Minutes.length,
      bursts: bursts.length,
      repeatedRequests: repeated.length,
      slowRequests: slowRequests.length,
      patterns: {
        bursts,
        repeated: repeated.slice(0, 10), // Top 10
        slow: slowRequests.slice(0, 10) // Top 10
      }
    };
  }
  
  private static detectBursts(requests: any[], windowMs: number) {
    const bursts = [];
    const sorted = [...requests].sort((a, b) => a.timestamp - b.timestamp);
    
    for (let i = 0; i < sorted.length; i++) {
      const windowStart = sorted[i].timestamp;
      const windowEnd = windowStart + windowMs;
      const windowRequests = sorted.filter(
        req => req.timestamp >= windowStart && req.timestamp <= windowEnd
      );
      
      if (windowRequests.length > 5) { // More than 5 requests in window
        bursts.push({
          start: windowStart,
          count: windowRequests.length,
          urls: [...new Set(windowRequests.map(req => req.url))]
        });
      }
    }
    
    return bursts;
  }
  
  private static detectRepeatedRequests(requests: any[]) {
    const urlCounts = requests.reduce((counts, req) => {
      const key = `${req.method} ${req.url}`;
      counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.entries(urlCounts)
      .filter(([_, count]) => (count as number) > 3) // More than 3 times in 5 minutes
      .map(([url, count]) => ({ url, count: count as number }))
      .sort((a, b) => b.count - a.count);
  }
}

// Global debugging helpers
if (process.env.NODE_ENV === 'development') {
  (window as any).apiPerformance = PerformanceMonitor;
  (window as any).requestPatterns = RequestPatternAnalyzer;
  
  console.log('🚀 API Optimization debugging tools available:');
  console.log('- window.apiPerformance.getAllStats() - View performance stats');
  console.log('- window.requestPatterns.detectPatterns() - Analyze request patterns');
}