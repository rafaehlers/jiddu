#!/bin/sh
set -e

mkdir -p /app/data

# Locate the prisma CLI entry from the copied node_modules.
PRISMA_BIN=""
if [ -f /app/node_modules/prisma/build/index.js ]; then
  PRISMA_BIN="/app/node_modules/prisma/build/index.js"
fi

if [ -n "$PRISMA_BIN" ]; then
  echo "[jiddu] running prisma migrate deploy…"
  node "$PRISMA_BIN" migrate deploy
else
  echo "[jiddu] prisma CLI not found, skipping migrate deploy"
fi

echo "[jiddu] seeding demo analyses (idempotent)…"
node scripts/seed-demo.mjs || echo "[jiddu] demo seed skipped"

echo "[jiddu] starting server on :${PORT:-3000}"
exec "$@"
