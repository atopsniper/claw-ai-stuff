#!/usr/bin/env bash
set -euo pipefail

# Minimal deploy script for claw-ai-stuff Cloudflare Worker
# Requirements:
#   - Node.js + npm (for installing wrangler if needed)
#   - Cloudflare account + API token configured for wrangler

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/worker"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "[deploy-worker] wrangler not found, installing locally via npm..."
  npm install -g wrangler
fi

echo "[deploy-worker] Deploying Cloudflare Worker defined in worker/wrangler.toml..."
wrangler deploy

echo "[deploy-worker] Done. Check your Cloudflare dashboard for the worker URL."
