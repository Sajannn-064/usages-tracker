// injected-debug.js - Debug version that logs all response headers

(function() {
  const originalFetch = window.fetch;
  
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      const clonedResponse = response.clone();
      
      const url = args[0];
      if (url && typeof url === 'string' && url.includes('api.anthropic.com')) {
        console.log('=== Anthropic API Request ===');
        console.log('URL:', url);
        console.log('Status:', clonedResponse.status);
        
        // Log ALL headers
        console.log('--- All Response Headers ---');
        for (const [key, value] of clonedResponse.headers.entries()) {
          console.log(`${key}: ${value}`);
        }
        
        // Specifically look for rate limit headers
        console.log('--- Rate Limit Headers ---');
        const headersToCheck = [
          'anthropic-ratelimit-remaining-requests',
          'anthropic-ratelimit-limit-requests',
          'anthropic-ratelimit-remaining-input-tokens',
          'anthropic-ratelimit-limit-input-tokens',
          'anthropic-ratelimit-remaining-output-tokens',
          'anthropic-ratelimit-limit-output-tokens',
          'anthropic-ratelimit-reset-requests',
          'anthropic-ratelimit-reset-tokens'
        ];
        
        headersToCheck.forEach(headerName => {
          const value = clonedResponse.headers.get(headerName);
          console.log(`${headerName}: ${value}`);
        });
        
        console.log('=== End ===\n');
      }

      return response;
    }).catch(error => {
      throw error;
    });
  };
})();
