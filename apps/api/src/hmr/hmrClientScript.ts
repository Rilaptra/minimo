// apps/api/src/hmr/hmrClientScript.ts

/**
 * Generate browser-side HMR client script.
 * Script ini di-inject ke HTML saat development mode.
 *
 * Fitur:
 * - Auto-connect ke WebSocket server
 * - Auto-reconnect saat koneksi terputus
 * - Full page reload untuk perubahan JS/backend
 * - Hot CSS swap tanpa reload
 * - Error overlay untuk build errors
 */
export function generateHMRClientScript(port: number): string {
  return `
(function() {
  var port = ${port};
  var socket = null;
  var reconnectTimer = null;
  var reconnectDelay = 1000;
  var maxDelay = 5000;

  function connect() {
    try {
      socket = new WebSocket('ws://localhost:' + port);
    } catch (e) {
      scheduleReconnect();
      return;
    }

    socket.onopen = function() {
      console.log('%c🔥 [HMR] Connected', 'color: #ff6b35; font-weight: bold');
      reconnectDelay = 1000;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    };

    socket.onmessage = function(e) {
      try {
        var msg = JSON.parse(e.data);
        handleMessage(msg);
      } catch (err) {
        console.error('[HMR] Parse error:', err);
      }
    };

    socket.onclose = function() {
      socket = null;
      console.log('[HMR] Disconnected. Reconnecting...');
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(function() {
      reconnectTimer = null;
      reconnectDelay = Math.min(reconnectDelay * 1.5, maxDelay);
      connect();
    }, reconnectDelay);
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case 'connected':
        console.log('[HMR] ✅ Ready for updates');
        break;
      case 'building':
        console.log('[HMR] 🔨 Building...');
        break;
      case 'full-reload':
        console.log('[HMR] 🔄 Reloading' + (msg.file ? ' (' + msg.file + ')' : '') + '...');
        window.location.reload();
        break;
      case 'css-update':
        console.log('[HMR] 🎨 Hot-swapping CSS...');
        updateCSS();
        break;
      case 'error':
        console.error('[HMR] ❌ Build error:', msg.data);
        showError(msg.data || 'Unknown error');
        break;
    }
  }

  function updateCSS() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    var updated = false;
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href && href.indexOf('styles.css') !== -1) {
        link.href = href.split('?')[0] + '?t=' + Date.now();
        updated = true;
      }
    });
    if (!updated) window.location.reload();
  }

  function showError(error) {
    var existing = document.getElementById('__hmr_error__');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = '__hmr_error__';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'background:rgba(0,0,0,0.88)', 'color:#ff6b6b',
      'font-family:monospace', 'font-size:14px', 'padding:24px',
      'z-index:99999', 'overflow:auto', 'white-space:pre-wrap',
      'word-break:break-all'
    ].join(';');

    var title = document.createElement('div');
    title.textContent = '🔥 HMR Build Error';
    title.style.cssText = 'color:#ff6b35;font-size:18px;font-weight:bold;margin-bottom:16px';
    overlay.appendChild(title);

    var pre = document.createElement('pre');
    pre.textContent = error;
    pre.style.cssText = 'color:#ff6b6b;margin:0';
    overlay.appendChild(pre);

    var btn = document.createElement('button');
    btn.textContent = '✕ Close';
    btn.style.cssText = 'position:fixed;top:16px;right:16px;background:#ff6b6b;color:#000;border:none;padding:8px 16px;border-radius:4px;cursor:pointer;font-weight:bold';
    btn.onclick = function() { overlay.remove(); };
    overlay.appendChild(btn);

    document.body.appendChild(overlay);
  }

  connect();
})();
`;
}
