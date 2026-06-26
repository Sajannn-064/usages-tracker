document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('claude-usage', (result) => {
    if (result['claude-usage']) update(result['claude-usage']);
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'USAGE_UPDATE') update(request.data);
  });

  function update(data) {
    const msgs = document.getElementById('msgs');
    const time = document.getElementById('time');
    if (msgs) msgs.textContent = data.message_count || 0;
    if (time) {
      const s = data.session_seconds || 0;
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      time.textContent = h > 0 ? h + 'h ' + (m % 60) + 'm' : m + 'm ' + (s % 60) + 's';
    }
  }
});