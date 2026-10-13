#!/usr/bin/env bash
#
# Deploy Jiddu to the VPS.
#
# IMPORTANT: this is the required production publishing path. A plain
# `git push` updates GitHub but does not update jiddu.app. Whenever a change
# must be "pushed", "published", "deployed" or "subida", run this script.
#
# Deployment runs from the maintainer's local machine using its configured
# SSH connection to the VPS. Build, test, and secret-scan checks run locally
# as documented in CONTRIBUTING.md. GitHub Actions is disabled for this repo.
#
# Usage (from your machine, after committing):
#     pnpm run deploy
#   or
#     bash scripts/deploy.sh
#
# Requirements:
#   - An SSH host alias `jiddu-vps` in ~/.ssh/config (override with
#     JIDDU_SSH_HOST=<alias-or-user@host>), pointing at the VPS with the
#     deploy key. The VPS must have /opt/deploy-jiddu.sh, which does:
#         git pull origin main && docker compose build \
#           && docker compose down --remove-orphans && docker compose up -d
#
set -euo pipefail

REMOTE_HOST="${JIDDU_SSH_HOST:-jiddu-vps}"
BRANCH="main"
HEALTH_URL="${JIDDU_HEALTH_URL:-https://jiddu.app/}"
CURRENT_BRANCH="$(git branch --show-current)"

if [[ "${CURRENT_BRANCH}" != "${BRANCH}" ]]; then
  echo "✗ Production deploys must run from ${BRANCH}; current branch is ${CURRENT_BRANCH}." >&2
  exit 1
fi

# The VPS pulls from GitHub, so the working tree must be fully committed —
# otherwise the deploy would silently ship an older state than what you see.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ Uncommitted changes — commit or stash before deploying:" >&2
  git status --short >&2
  exit 1
fi

EXPECTED_SHA="$(git rev-parse HEAD)"
BUILD_STAMP="$(TZ=America/Sao_Paulo date '+%Y-%m-%d_%H:%M')"
BUILD_DATE="${BUILD_STAMP%%_*}"
BUILD_TIME="${BUILD_STAMP#*_}"
BUILD_HASH="${EXPECTED_SHA:0:7}"
BUILD_VERSION="${BUILD_DATE} ${BUILD_TIME} ${BUILD_HASH}"

echo "→ Pushing ${BRANCH} to GitHub…"
git push origin "${BRANCH}"

echo "→ Deploying version ${BUILD_VERSION} on VPS (${REMOTE_HOST})… (docker build can take a few minutes)"
ssh -o ConnectTimeout=15 "${REMOTE_HOST}" \
  "JIDDU_BUILD_DATE='${BUILD_DATE}' JIDDU_BUILD_TIME='${BUILD_TIME}' JIDDU_BUILD_HASH='${BUILD_HASH}' bash /opt/deploy-jiddu.sh"

REMOTE_STATE="$(
  ssh -o ConnectTimeout=15 "${REMOTE_HOST}" \
    'cd /opt/jiddu && printf "%s %s" "$(git rev-parse HEAD)" "$(docker inspect -f "{{.State.Status}}" jiddu-app)"'
)"
REMOTE_SHA="${REMOTE_STATE%% *}"
CONTAINER_STATUS="${REMOTE_STATE#* }"

if [[ "${REMOTE_SHA}" != "${EXPECTED_SHA}" ]]; then
  echo "✗ VPS SHA mismatch: expected ${EXPECTED_SHA}, found ${REMOTE_SHA}." >&2
  exit 1
fi
if [[ "${CONTAINER_STATUS}" != "running" ]]; then
  echo "✗ VPS container is ${CONTAINER_STATUS}, not running." >&2
  exit 1
fi

echo "→ Health check: ${HEALTH_URL}"
# The container restarts and runs migrations + reseed on boot, so the proxy
# may briefly return 502 before the app is ready. Retry for ~60s.
code=""
for _ in $(seq 1 12); do
  code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${HEALTH_URL}" || true)"
  [[ "${code}" == "200" ]] && break
  sleep 5
done
if [[ "${code}" == "200" ]]; then
  echo "✓ Deploy complete — ${REMOTE_SHA} — ${HEALTH_URL} → ${code}"
else
  echo "✗ Site still returning HTTP ${code} after retries — check the VPS." >&2
  exit 1
fi
