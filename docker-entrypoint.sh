#!/bin/sh
set -e

mkdir -p /app/data

PRISMA_BIN="/opt/prisma-cli/node_modules/prisma/build/index.js"
if [ -f "$PRISMA_BIN" ]; then
  echo "[jiddu] running prisma migrate deploy…"
  NODE_PATH="/opt/prisma-cli/node_modules" node "$PRISMA_BIN" migrate deploy
else
  echo "[jiddu] prisma CLI not found, skipping migrate deploy"
fi

echo "[jiddu] seeding demo analyses (idempotent)…"
node scripts/seed-demo.mjs || echo "[jiddu] demo seed skipped"

echo "[jiddu] starting server on :${PORT:-3000}"
exec "$@"
