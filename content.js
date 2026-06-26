// content.js - Runs in Claude.ai tab context
// This injects a script to intercept API calls and forward usage data to background worker

(function() {
  // Inject the tracking script directly into page context (to intercept fetch)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  
  // Wait for document head to exist
  if (document.head) {
    document.head.appendChild(script);
  } else {
    document.documentElement.appendChild(script);
  }

  // Listen for messages from injected.js
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'RATE_LIMIT_UPDATE') {
      // Forward to background worker for storage
      try {
        chrome.runtime.sendMessage({
          type: 'RATE_LIMIT_UPDATE',
          payload: event.data.payload
        }, (response) => {
          // Silently ignore response
        });
      } catch (error) {
        console.error('Failed to send message to background:', error);
      }
    }
  });
})();
