// background.js - Service worker for persistent storage

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RATE_LIMIT_UPDATE') {
    // Store in chrome.storage for persistence across tabs
    chrome.storage.local.set({
      'claude-usage': {
        ...request.payload,
        last_update: new Date().toISOString()
      }
    });

    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'USAGE_UPDATE',
          data: request.payload
        }).catch(() => {
          // Tab might not have listener
        });
      });
    });

    sendResponse({ success: true });
  }
});

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    'claude-usage': {
      rpm_used: 0,
      rpm_limit: null,
      itpm_used: 0,
      itpm_limit: null,
      otpm_used: 0,
      otpm_limit: null,
      reset_time: null,
      last_update: null
    }
  });
});
