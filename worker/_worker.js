// Minimal worker for claw-ai-stuff
// P0: basic routing + simple ADMIN awareness

const VERSION = "0.1.1";

function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
    ...init,
  });
}

function textResponse(text, init = {}) {
  return new Response(text, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      ...init.headers,
    },
    ...init,
  });
}

function htmlResponse(html, init = {}) {
  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...init.headers,
    },
    ...init,
  });
}

function getBasicInfo(env, url) {
  const hasAdmin = Boolean(env.ADMIN && String(env.ADMIN).length > 0);
  const hasKv = Boolean(env.KV);

  return {
    name: "claw-ai-stuff",
    version: VERSION,
    url: url.origin,
    hasAdmin,
    hasKv,
    // 只暴露是否存在，不暴露具体值
    env: {
      ADMIN: hasAdmin ? "configured" : "missing",
      KV: hasKv ? "bound" : "unbound",
    },
  };
}

function handleHttp(request, env, url) {
  const { pathname } = url;

  if (request.method === "GET") {
    if (pathname === "/" || pathname === "") {
      const info = getBasicInfo(env, url);
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>claw-ai-stuff worker</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2rem; line-height: 1.6; }
    code { background: #f5f5f5; padding: 0.15rem 0.3rem; border-radius: 3px; }
    .tag { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 999px; font-size: 0.8rem; margin-right: 0.25rem; }
    .ok { background: #e6ffed; color: #036635; }
    .warn { background: #fff5e6; color: #9a5a00; }
  </style>
</head>
<body>
  <h1>claw-ai-stuff worker</h1>
  <p>Minimal Cloudflare Worker backend for the claw-ai-stuff project.</p>

  <ul>
    <li><strong>Version:</strong> <code>${info.version}</code></li>
    <li><strong>Worker URL:</strong> <code>${info.url}</code></li>
  </ul>

  <p>
    <span class="tag ${info.hasAdmin ? "ok" : "warn"}">
      ADMIN: ${info.hasAdmin ? "configured" : "missing"}
    </span>
    <span class="tag ${info.hasKv ? "ok" : "warn"}">
      KV: ${info.hasKv ? "bound" : "unbound"}
    </span>
  </p>

  <h2>Useful endpoints</h2>
  <ul>
    <li><code>GET /health</code> — health check JSON</li>
    <li><code>GET /info</code> — basic runtime info</li>
    <li><code>GET /ws-test</code> — simple WebSocket echo test page</li>
  </ul>
</body>
</html>`;
      return htmlResponse(html);
    }

    if (pathname === "/health") {
      const info = getBasicInfo(env, url);
      return jsonResponse({ ok: true, name: info.name, version: info.version });
    }

    if (pathname === "/info") {
      return jsonResponse(getBasicInfo(env, url));
    }

    if (pathname === "/ws-test") {
      const wsUrl = (url.protocol === "https:" ? "wss://" : "ws://") + url.host + "/ws";
      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>claw-ai-stuff WebSocket test</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 2rem; }
    #log { white-space: pre-wrap; border: 1px solid #eee; padding: 0.5rem; margin-top: 1rem; max-height: 300px; overflow-y: auto; }
    button { padding: 0.4rem 0.8rem; margin-right: 0.5rem; }
    input { padding: 0.3rem 0.5rem; width: 250px; }
  </style>
</head>
<body>
  <h1>WebSocket echo test</h1>
  <p>Connecting to: <code>${wsUrl}</code></p>
  <div>
    <button id="connect">Connect</button>
    <button id="close">Close</button>
  </div>
  <div style="margin-top: 0.5rem;">
    <input id="msg" value="ping" />
    <button id="send">Send</button>
  </div>
  <div id="log"></div>

  <script>
    const wsUrl = ${JSON.stringify(wsUrl)};
    let ws = null;
    const logEl = document.getElementById('log');
    function log(msg) {
      const now = new Date().toISOString().split('T')[1].replace('Z', '');
      logEl.textContent += '[' + now + '] ' + msg + '\n';
      logEl.scrollTop = logEl.scrollHeight;
    }

    document.getElementById('connect').onclick = () => {
      if (ws) {
        log('already connected');
        return;
      }
      ws = new WebSocket(wsUrl);
      ws.onopen = () => log('WebSocket open');
      ws.onmessage = (ev) => log('recv: ' + ev.data);
      ws.onclose = () => { log('WebSocket closed'); ws = null; };
      ws.onerror = (err) => { log('WebSocket error'); };
    };

    document.getElementById('close').onclick = () => {
      if (ws) ws.close();
    };

    document.getElementById('send').onclick = () => {
      const v = document.getElementById('msg').value;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        log('cannot send, ws not open');
        return;
      }
      log('send: ' + v);
      ws.send(v);
    };
  </script>
</body>
</html>`;
      return htmlResponse(html);
    }
  }

  // 其他请求：暂时统一返回占位信息
  return textResponse(
    "claw-ai-stuff worker backend placeholder. Routes: /, /health, /info, /ws (WebSocket)",
  );
}

function handleWebSocket(request) {
  const upgradeHeader = request.headers.get("Upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept();

  server.addEventListener("message", (event) => {
    // 简单 echo：未来可以在这里挂 VLESS/Trojan 解析
    server.send(typeof event.data === "string" ? event.data : "[binary message]");
  });

  server.addEventListener("close", () => {
    // 目前不记录日志，保持简单
  });

  return new Response(null, { status: 101, webSocket: client });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // WebSocket 入口：/ws
    if (pathname === "/ws") {
      return handleWebSocket(request);
    }

    // 其他都按 HTTP 处理
    return handleHttp(request, env, url);
  },
};
