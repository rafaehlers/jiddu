#!/bin/sh
set -e

mkdir -p /app/data

echo "[jiddu] running prisma migrate deploy…"
npx prisma migrate deploy

echo "[jiddu] seeding demo analyses (idempotent)…"
node scripts/seed-demo.mjs || echo "[jiddu] demo seed skipped"

echo "[jiddu] starting server on :${PORT:-3000}"
exec "$@"
