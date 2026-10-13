#!/usr/bin/env bash
# ==============================================================================
# SafShekan Automated PostgreSQL Backup Script
# Retention Policy: 7 Daily Backups + 4 Weekly Backups (Sunday)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/saf-shekan/backups}"
DAILY_DIR="${BACKUP_DIR}/daily"
WEEKLY_DIR="${BACKUP_DIR}/weekly"
CONTAINER_NAME="${PG_CONTAINER:-saf-shekan-postgres}"
PG_USER="${POSTGRES_USER:-safshekan}"
PG_DB="${POSTGRES_DB:-safshekan_db}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u") # 1 = Monday, 7 = Sunday
FILENAME="safshekan_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${DAILY_DIR}" "${WEEKLY_DIR}"

echo "[$(date -Iseconds)] Starting PostgreSQL database backup for ${PG_DB}..."

# Verify Postgres container is running and healthy
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "::error::Postgres container ${CONTAINER_NAME} is not running!" >&2
  exit 1
fi

TEMP_BACKUP="${DAILY_DIR}/${FILENAME}"

# Stream compressed pg_dump directly from container
docker exec "${CONTAINER_NAME}" pg_dump -U "${PG_USER}" -d "${PG_DB}" -F p --no-owner --no-acl \
  | gzip -9 > "${TEMP_BACKUP}"

# Verify backup integrity
if [ ! -s "${TEMP_BACKUP}" ]; then
  echo "::error::Backup failed: Output file is empty!" >&2
  rm -f "${TEMP_BACKUP}"
  exit 1
fi

# Generate SHA256 checksum
sha256sum "${TEMP_BACKUP}" > "${TEMP_BACKUP}.sha256"
FILE_SIZE=$(du -h "${TEMP_BACKUP}" | cut -f1)
echo "[$(date -Iseconds)] Backup created successfully: ${TEMP_BACKUP} (${FILE_SIZE})"

# Copy to weekly if today is Sunday (day 7)
if [ "${DAY_OF_WEEK}" -eq 7 ]; then
  cp -p "${TEMP_BACKUP}" "${WEEKLY_DIR}/${FILENAME}"
  cp -p "${TEMP_BACKUP}.sha256" "${WEEKLY_DIR}/${FILENAME}.sha256"
  echo "[$(date -Iseconds)] Weekly snapshot archived: ${WEEKLY_DIR}/${FILENAME}"
fi

# Retention Cleanup: Keep 7 daily backups
echo "[$(date -Iseconds)] Enforcing retention policy: keeping latest 7 daily backups..."
ls -1t "${DAILY_DIR}"/safshekan_backup_*.sql.gz 2>/dev/null | tail -n +8 | while read -r old_file; do
  echo "Removing expired daily backup: ${old_file}"
  rm -f "${old_file}" "${old_file}.sha256"
done

# Retention Cleanup: Keep 4 weekly backups
echo "[$(date -Iseconds)] Enforcing retention policy: keeping latest 4 weekly backups..."
ls -1t "${WEEKLY_DIR}"/safshekan_backup_*.sql.gz 2>/dev/null | tail -n +5 | while read -r old_file; do
  echo "Removing expired weekly backup: ${old_file}"
  rm -f "${old_file}" "${old_file}.sha256"
done

# Optional Offsite Replication (e.g. rclone sync, scp, or s3cmd)
if [ -n "${OFFSITE_SYNC_CMD:-}" ]; then
  echo "[$(date -Iseconds)] Executing offsite backup replication command..."
  eval "${OFFSITE_SYNC_CMD}"
fi

echo "[$(date -Iseconds)] Backup, retention, and offsite sync completed successfully."
