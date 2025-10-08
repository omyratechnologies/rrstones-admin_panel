/**
 * Auto-refresh utility for settings updates
 */

export interface AutoRefreshOptions {
  delay?: number; // Delay in milliseconds before refresh (default: 1500)
  showCountdown?: boolean; // Show countdown in toast (default: true)
  skipRefresh?: boolean; // Skip refresh for testing (default: false)
}

/**
 * Triggers an automatic hard refresh with user feedback
 */
export const triggerAutoRefresh = (options: AutoRefreshOptions = {}) => {
  const {
    delay = 1500,
    showCountdown = true,
    skipRefresh = false
  } = options;

  if (skipRefresh) {
    console.log('Auto-refresh skipped (testing mode)');
    return;
  }

  if (showCountdown && delay > 1000) {
    let remainingSeconds = Math.ceil(delay / 1000);
    
    const updateCountdown = () => {
      if (remainingSeconds > 0) {
        console.log(`🔄 Page will refresh in ${remainingSeconds} seconds...`);
        remainingSeconds--;
        setTimeout(updateCountdown, 1000);
      }
    };
    
    updateCountdown();
  }

  setTimeout(() => {
    console.log('🔄 Performing hard refresh...');
    window.location.reload();
  }, delay);
};

/**
 * Generate success message with refresh notification
 */
export const getRefreshSuccessMessage = (settingName?: string): string => {
  const base = settingName ? `${settingName} updated successfully` : 'Setting updated successfully';
  return `${base} - Refreshing page...`;
};
