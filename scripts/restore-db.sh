#!/usr/bin/env bash
# ==============================================================================
# SafShekan PostgreSQL Database Restore Script
# Safely restores a .sql.gz or .sql dump into the running PostgreSQL container.
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
FORCE="${2:-}"
CONTAINER_NAME="${PG_CONTAINER:-saf-shekan-postgres}"
PG_USER="${POSTGRES_USER:-safshekan}"
PG_DB="${POSTGRES_DB:-safshekan_db}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup.sql.gz> [--force]"
  echo "Available daily backups:"
  ls -lh /opt/saf-shekan/backups/daily/ 2>/dev/null || true
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "::error::Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

# Verify checksum if present
if [ -f "${BACKUP_FILE}.sha256" ]; then
  echo "Verifying SHA256 checksum..."
  sha256sum -c "${BACKUP_FILE}.sha256" || {
    echo "::error::Checksum verification failed! File may be corrupted." >&2
    exit 1
  }
  echo "Checksum OK."
fi

# Safeguard prompt
if [ "${FORCE}" != "--force" ]; then
  echo "=================================================================="
  echo "WARNING: Restoring will OVERWRITE data in ${PG_DB} on ${CONTAINER_NAME}!"
  echo "Backup file: ${BACKUP_FILE}"
  echo "=================================================================="
  read -r -p "Type 'RESTORE' to proceed: " CONFIRM
  if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "Restore cancelled by user."
    exit 0
  fi
fi

echo "[$(date -Iseconds)] Initiating restore into ${PG_DB}..."

# Terminate active connections to allow clean restore
docker exec "${CONTAINER_NAME}" psql -U "${PG_USER}" -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${PG_DB}' AND pid <> pg_backend_pid();
" || true

# Restore stream
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  echo "Decompressing and piping SQL dump to psql..."
  gzip -dc "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${PG_USER}" -d "${PG_DB}" -v ON_ERROR_STOP=1
else
  echo "Piping plain SQL dump to psql..."
  docker exec -i "${CONTAINER_NAME}" psql -U "${PG_USER}" -d "${PG_DB}" -v ON_ERROR_STOP=1 < "${BACKUP_FILE}"
fi

echo "[$(date -Iseconds)] Database restore completed successfully for ${PG_DB}."
