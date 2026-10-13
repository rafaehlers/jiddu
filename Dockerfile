# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:22-slim AS deps
WORKDIR /app
# better-sqlite3 needs build tools to compile native bindings against the
# container's libc (musl vs glibc, version matching).
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --include=dev

# ---------- builder ----------
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Next evaluates parts of the server module graph while collecting build-time
# page metadata. Runtime receives the real private URL from Docker Compose.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client into src/generated/prisma.
RUN npx prisma generate
# The deploy script supplies these values without spaces so they survive the
# local-to-SSH-to-Compose handoff. Next inlines their joined value client-side.
ARG JIDDU_BUILD_DATE=0000-00-00
ARG JIDDU_BUILD_TIME=00:00
ARG JIDDU_BUILD_HASH=local
ENV NEXT_PUBLIC_JIDDU_BUILD_VERSION="${JIDDU_BUILD_DATE} ${JIDDU_BUILD_TIME} ${JIDDU_BUILD_HASH}"
RUN npm run build

# ---------- runner ----------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV TZ=America/Sao_Paulo
# openssl is needed by Prisma migration engine; libstdc++ comes with the base.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home nextjs

# Standalone Next output already bundles the runtime + node_modules.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/LICENSE /app/THIRD_PARTY_NOTICES.md ./
# Prisma migrations.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
# Seed script (executed at container startup).
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

# Install prisma CLI + its full transitive tree in a dedicated location so
# `prisma migrate deploy` works without dragging dev deps into the bundle.
RUN mkdir -p /opt/prisma-cli \
 && cd /opt/prisma-cli \
 && npm init -y >/dev/null \
 && npm install --no-audit --no-fund --no-progress prisma@7.8.0 dotenv \
 && chown -R nextjs:nodejs /opt/prisma-cli

RUN chmod +x ./docker-entrypoint.sh \
 && mkdir -p /app/data \
 && chown -R nextjs:nodejs /app/data

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
