// Minimal placeholder for claw-ai-stuff Cloudflare Worker
// TODO: replace with refined logic derived from edgetunnel

export default {
  async fetch(request, env, ctx) {
    return new Response(
      "claw-ai-stuff worker is running. Backend logic to be implemented.",
      { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  },
};
