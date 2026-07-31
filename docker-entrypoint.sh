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

if [ -f /app/sqlite-data/jiddu.db ]; then
  echo "[jiddu] importing the legacy SQLite database if needed…"
  SQLITE_DATABASE_PATH=/app/sqlite-data/jiddu.db \
    node scripts/import-sqlite-to-postgres.mjs
fi

echo "[jiddu] starting server on :${PORT:-3000}"
exec "$@"
