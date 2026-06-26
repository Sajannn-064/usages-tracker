# Claude Usage Tracker Extension

A real-time browser extension to monitor your Claude API rate limits while using Claude.ai.

## What It Does

- **Intercepts API requests** to Anthropic's servers
- **Parses rate limit headers** (`anthropic-ratelimit-*`) from every response
- **Displays real-time usage** in a widget on Claude.ai
- **Shows percentage of limits consumed** (RPM, ITPM, OTPM)
- **Warns when approaching limits** (80%+) with color-coded alerts
- **Tracks reset time** so you know when limits reset

## Installation

### Step 1: Prepare Files
All extension files are in `/home/claude/`:
- `manifest.json` - Extension configuration
- `background.js` - Service worker for storage
- `content.js` - Content script that injects tracker
- `injected.js` - Fetch interceptor (runs in page context)
- `popup.html`, `popup.js`, `popup-styles.css` - Extension popup
- `styles.css` - In-page widget styles

### Step 2: Load in Chrome/Chromium

1. Open `chrome://extensions/` 
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Navigate to `/home/claude/` and select the folder
5. Extension should appear in your extensions list

### Step 3: Use It

1. Go to `https://claude.ai`
2. Start a conversation
3. Watch the widget appear in the **bottom-right corner**
4. Click the extension icon for a detailed popup

---

## Architecture

### Three-Layer Design

**Layer 1: Injected Script (`injected.js`)**
- Runs in page context (not isolated from window)
- Intercepts all `fetch()` calls
- Parses `anthropic-ratelimit-*` headers
- Sends data to content script via `postMessage`

**Layer 2: Content Script (`content.js`)**
- Receives data from injected script
- Renders in-page widget
- Forwards data to background worker

**Layer 3: Background Worker (`background.js`)**
- Persistent storage using `chrome.storage.local`
- Syncs data across all Claude.ai tabs
- Handles message routing

### Data Flow

```
API Response
    ↓
injected.js (parse headers)
    ↓
window.postMessage()
    ↓
content.js (listen)
    ↓
chrome.runtime.sendMessage()
    ↓
background.js (store)
    ↓
Broadcast to all tabs
    ↓
Widget update + Popup display
```

---

## Rate Limits Explained

The API response includes headers that show you the rate limit enforced, current usage, and when the limit will be reset.

### Three Independent Limits

1. **RPM (Requests Per Minute)**
   - How many API calls you can make per minute
   - One blocked request = no more API calls until reset

2. **ITPM (Input Tokens Per Minute)**
   - How many tokens you send to Claude per minute
   - Large prompts consume more input tokens

3. **OTPM (Output Tokens Per Minute)**
   - How many tokens Claude can send back per minute
   - Long responses consume more output tokens

**Key Point:** These are **completely separate**. You can be at 95% ITPM while still having headroom on RPM and OTPM.

---

## Troubleshooting

### Widget Not Appearing
1. Check that extension is enabled in `chrome://extensions/`
2. Hard-refresh Claude.ai (`Ctrl+Shift+R` or `Cmd+Shift+R`)
3. Open DevTools (F12) and check Console for errors

### Headers Not Parsing
1. The extension intercepts API calls to `api.anthropic.com`
2. Ensure you're using Claude.ai (not API directly)
3. Check DevTools Network tab → filter by `api.anthropic.com`
4. Verify response headers exist

### Storage Issues
1. Clear extension storage: `chrome://extensions/` → Details → Storage → Clear data
2. Reload extension
3. Try again on Claude.ai

---

## Future Enhancements

- [ ] Historical usage charts (tokens over time)
- [ ] Per-model tracking (Opus vs Sonnet vs Haiku)
- [ ] Export usage reports (CSV/JSON)
- [ ] Configurable warning thresholds
- [ ] Dark mode
- [ ] Multiple API key tracking
- [ ] Batch API quota monitoring

---

---

only for claude.ai
Documentation by Claude.ai
