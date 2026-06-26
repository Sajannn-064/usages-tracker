// background.js

let totalInput = 0;
let totalOutput = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RATE_LIMIT_UPDATE') {
    
    // Accumulate totals
    totalInput += (request.payload.input_tokens || 0);
    totalOutput += (request.payload.output_tokens || 0);

    const data = {
      ...request.payload,
      total_tokens: totalInput + totalOutput,
      total_input: totalInput,
      total_output: totalOutput,
      last_update: new Date().toISOString()
    };

    chrome.storage.local.set({ 'claude-usage': data }, () => {
      // Broadcast to popup
      chrome.tabs.query({ url: 'https://claude.ai/*' }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'USAGE_UPDATE',
            data: data
          }).catch(() => {});
        });
      });
      sendResponse({ success: true });
    });

    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 'claude-usage': {
    message_count: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    last_update: null
  }});
  console.log('Claude Usage Tracker installed!');
});