// injected.js - Runs in page context to intercept fetch calls
// This captures anthropic-ratelimit-* headers from API responses

(function() {
  const originalFetch = window.fetch;
  
  // Track current usage (updated per request)
  const usageState = {
    rpm_used: 0,
    rpm_limit: null,
    itpm_used: 0,
    itpm_limit: null,
    otpm_used: 0,
    otpm_limit: null,
    reset_time: null,
    last_update: null
  };

  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      // Clone response to read headers without consuming body
      const clonedResponse = response.clone();
      
      // Check if this is an Anthropic API call
      if (args[0] && args[0].includes('api.anthropic.com')) {
        parseRateLimitHeaders(clonedResponse.headers);
      }

      return response;
    }).catch(error => {
      throw error;
    });
  };

  function parseRateLimitHeaders(headers) {
    // Anthropic uses anthropic-ratelimit-* headers
    // Format: anthropic-ratelimit-<type>-<period>-<metric>
    
    try {
      // Modern unified headers (as of May 2026)
      const unifiedRemaining = headers.get('anthropic-ratelimit-unified-remaining-requests');
      const unifiedLimit = headers.get('anthropic-ratelimit-unified-limit-requests');
      const resetAfter = headers.get('anthropic-ratelimit-reset-requests');
      
      // Fallback to individual headers if unified not present
      const rpmRemaining = headers.get('anthropic-ratelimit-remaining-requests') || unifiedRemaining;
      const rpmLimit = headers.get('anthropic-ratelimit-limit-requests') || unifiedLimit;
      
      const itpmRemaining = headers.get('anthropic-ratelimit-remaining-tokens');
      const itpmLimit = headers.get('anthropic-ratelimit-limit-tokens');
      
      // Parse values
      if (rpmRemaining && rpmLimit) {
        usageState.rpm_used = parseInt(rpmLimit) - parseInt(rpmRemaining);
        usageState.rpm_limit = parseInt(rpmLimit);
      }

      if (itpmRemaining && itpmLimit) {
        usageState.itpm_used = parseInt(itpmLimit) - parseInt(itpmRemaining);
        usageState.itpm_limit = parseInt(itpmLimit);
      }

      // For OTPM, look for output-specific headers
      const otpmRemaining = headers.get('anthropic-ratelimit-remaining-output-tokens');
      const otpmLimit = headers.get('anthropic-ratelimit-limit-output-tokens');
      
      if (otpmRemaining && otpmLimit) {
        usageState.otpm_used = parseInt(otpmLimit) - parseInt(otpmRemaining);
        usageState.otpm_limit = parseInt(otpmLimit);
      }

      // Parse reset time
      if (resetAfter) {
        const resetTime = new Date();
        resetTime.setSeconds(resetTime.getSeconds() + parseInt(resetAfter));
        usageState.reset_time = resetTime.toISOString();
      }

      usageState.last_update = new Date().toISOString();

      // Send update to content script
      window.postMessage({
        type: 'RATE_LIMIT_UPDATE',
        payload: usageState
      }, '*');

    } catch (error) {
      console.error('Error parsing rate limit headers:', error);
    }
  }
})();
