#!/usr/bin/env bash
#
# Deploy Jiddu to the VPS.
#
# Replaces the GitHub Actions workflow. The Actions runner is blocked from
# reaching the VPS on port 22 (firewall / fail2ban), but SSH from a local
# machine works fine — so we push to GitHub and trigger the deploy over our
# own SSH connection instead of through CI.
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

# The VPS pulls from GitHub, so the working tree must be fully committed —
# otherwise the deploy would silently ship an older state than what you see.
if [[ -n "$(git status --porcelain)" ]]; then
  echo "✗ Uncommitted changes — commit or stash before deploying:" >&2
  git status --short >&2
  exit 1
fi

echo "→ Pushing ${BRANCH} to GitHub…"
git push origin "${BRANCH}"

echo "→ Deploying on VPS (${REMOTE_HOST})… (docker build can take a few minutes)"
ssh -o ConnectTimeout=15 "${REMOTE_HOST}" 'bash /opt/deploy-jiddu.sh'

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
  echo "✓ Deploy complete — ${HEALTH_URL} → ${code}"
else
  echo "✗ Site still returning HTTP ${code} after retries — check the VPS." >&2
  exit 1
fi
