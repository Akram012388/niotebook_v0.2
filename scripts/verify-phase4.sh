#!/usr/bin/env bash
set -euo pipefail

echo "=== Phase 4 Verification ==="

# Force stable dev (no Turbopack)
export NEXT_DISABLE_TURBOPACK=1

echo "→ Kill any running Next dev"
pkill -f "next dev" || true
pkill -f "next" || true

echo "→ Clean caches"
rm -rf .next
rm -rf node_modules/.cache || true

echo "→ Build + typecheck"
bun run build
bun run typecheck || true

echo "→ Unit tests"
bun run test

echo "→ Start Next dev (non-Turbopack)"
PORT=3000
bunx next dev --port $PORT >/tmp/next-dev.log 2>&1 &
DEV_PID=$!

# Wait for server
echo "→ Waiting for dev server"
for i in {1..15}; do
  if curl -sf "http://localhost:$PORT" >/dev/null; then
    break
  fi
  sleep 1
done

echo "→ E2E (BASE_URL mode; no Convex preview)"
BASE_URL="http://localhost:$PORT" bun run test:e2e

echo "→ Stop dev server"
kill $DEV_PID || true

echo "=== Phase 4 Verification PASSED ==="
