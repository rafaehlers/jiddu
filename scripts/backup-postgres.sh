#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="${JIDDU_POSTGRES_BACKUP_DIR:-/opt/backups/jiddu-postgres}"
RETENTION_DAYS="${JIDDU_POSTGRES_BACKUP_RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILENAME="jiddu-${TIMESTAMP}.dump"

umask 077
mkdir -p "${BACKUP_DIR}"
TEMP_FILE="$(mktemp "${BACKUP_DIR}/.${FILENAME}.tmp.XXXXXX")"

cleanup() {
  rm -f "${TEMP_FILE}"
}
trap cleanup EXIT

docker exec jiddu-db \
  pg_dump --username=jiddu --dbname=jiddu --format=custom --compress=9 \
  > "${TEMP_FILE}"

test -s "${TEMP_FILE}"
mv "${TEMP_FILE}" "${BACKUP_DIR}/${FILENAME}"

docker run --rm --network none \
  --volume "${BACKUP_DIR}:/backups:ro" \
  postgres:16-alpine \
  pg_restore --list "/backups/${FILENAME}" >/dev/null

find "${BACKUP_DIR}" -type f -name 'jiddu-*.dump' \
  -mtime "+${RETENTION_DAYS}" -delete

echo "Jiddu PostgreSQL backup verified: ${BACKUP_DIR}/${FILENAME}"
