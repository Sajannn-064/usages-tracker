(function() {
  const originalFetch = window.fetch;
  let messageCount = 0;
  let sessionStart = Date.now();

  window.fetch = function(...args) {
    const url = String(args[0]);

    if (url.includes('a-api.anthropic.com')) {
      messageCount++;
      const elapsed = Math.floor((Date.now() - sessionStart) / 1000);

      window.postMessage({
        type: 'RATE_LIMIT_UPDATE',
        payload: {
          message_count: messageCount,
          session_seconds: elapsed,
          last_update: new Date().toISOString()
        }
      }, '*');
    }

    return originalFetch.apply(this, args);
  };
})();