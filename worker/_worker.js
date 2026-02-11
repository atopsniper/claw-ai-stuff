// Minimal worker for claw-ai-stuff
// P0: basic routing + simple ADMIN awareness

const VERSION = "0.1.0";

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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // 基本路由
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
    <li><code>GET /health</code> &mdash; health check JSON</li>
    <li><code>GET /info</code> &mdash; basic runtime info</li>
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
    }

    // 其他请求：暂时统一返回占位信息
    return textResponse(
      "claw-ai-stuff worker backend placeholder. Routes: /, /health, /info",
    );
  },
};
