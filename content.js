// content.js - Runs in Claude.ai tab context
// This injects a usage tracker widget and forwards API data to background worker

(function() {
  // Inject the tracking script directly into page context (to intercept fetch)
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  script.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(script);

  // Listen for messages from injected.js
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    if (event.data.type === 'RATE_LIMIT_UPDATE') {
      // Forward to background worker for storage + sync
      chrome.runtime.sendMessage({
        type: 'RATE_LIMIT_UPDATE',
        payload: event.data.payload
      });
    }
  });

  // Create widget container
  createUsageWidget();

  // Listen for updates from background worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'USAGE_UPDATE') {
      updateWidget(request.data);
    }
  });
})();

function createUsageWidget() {
  // Create widget container
  const widget = document.createElement('div');
  widget.id = 'claude-usage-tracker';
  widget.innerHTML = `
    <div class="usage-tracker-widget">
      <div class="tracker-header">
        <h4>API Usage</h4>
        <button id="tracker-minimize">−</button>
      </div>
      <div class="tracker-content">
        <div class="metric">
          <label>Requests/Min (RPM)</label>
          <div class="progress-bar">
            <div class="progress-fill rpm-fill" style="width: 0%"></div>
          </div>
          <span class="metric-value rpm-value">0 / --</span>
        </div>
        
        <div class="metric">
          <label>Input Tokens/Min (ITPM)</label>
          <div class="progress-bar">
            <div class="progress-fill itpm-fill" style="width: 0%"></div>
          </div>
          <span class="metric-value itpm-value">0 / --</span>
        </div>
        
        <div class="metric">
          <label>Output Tokens/Min (OTPM)</label>
          <div class="progress-bar">
            <div class="progress-fill otpm-fill" style="width: 0%"></div>
          </div>
          <span class="metric-value otpm-value">0 / --</span>
        </div>

        <div class="metric">
          <label>Resets At</label>
          <span class="reset-time">--:--</span>
        </div>

        <div class="warning-zone" id="warning-zone"></div>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // Minimize toggle
  document.getElementById('tracker-minimize').addEventListener('click', () => {
    const content = widget.querySelector('.tracker-content');
    content.classList.toggle('minimized');
  });
}

function updateWidget(data) {
  // RPM
  const rpmUsed = data.rpm_used || 0;
  const rpmLimit = data.rpm_limit || 1;
  const rpmPercent = Math.min((rpmUsed / rpmLimit) * 100, 100);
  
  document.querySelector('.rpm-fill').style.width = rpmPercent + '%';
  document.querySelector('.rpm-value').textContent = `${rpmUsed} / ${rpmLimit}`;

  // ITPM
  const itpmUsed = data.itpm_used || 0;
  const itpmLimit = data.itpm_limit || 1;
  const itpmPercent = Math.min((itpmUsed / itpmLimit) * 100, 100);
  
  document.querySelector('.itpm-fill').style.width = itpmPercent + '%';
  document.querySelector('.itpm-value').textContent = `${itpmUsed} / ${itpmLimit}`;

  // OTPM
  const otpmUsed = data.otpm_used || 0;
  const otpmLimit = data.otpm_limit || 1;
  const otpmPercent = Math.min((otpmUsed / otpmLimit) * 100, 100);
  
  document.querySelector('.otpm-fill').style.width = otpmPercent + '%';
  document.querySelector('.otpm-value').textContent = `${otpmUsed} / ${otpmLimit}`;

  // Reset time
  if (data.reset_time) {
    const resetDate = new Date(data.reset_time);
    document.querySelector('.reset-time').textContent = resetDate.toLocaleTimeString();
  }

  // Warning logic
  const warningZone = document.getElementById('warning-zone');
  warningZone.innerHTML = '';

  const limits = [
    { name: 'RPM', percent: rpmPercent },
    { name: 'ITPM', percent: itpmPercent },
    { name: 'OTPM', percent: otpmPercent }
  ];

  limits.forEach(limit => {
    if (limit.percent >= 80) {
      const warning = document.createElement('div');
      warning.className = `warning ${limit.percent >= 95 ? 'critical' : 'caution'}`;
      warning.textContent = `⚠️ ${limit.name} at ${Math.round(limit.percent)}%`;
      warningZone.appendChild(warning);
    }
  });
}
