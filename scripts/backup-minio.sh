#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups/minio}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/minio-${TS}.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating MinIO data backup: $OUT_FILE"
docker compose -f docker-compose.coolify.yml exec -T minio sh -lc 'tar -C /data -czf - .' > "$OUT_FILE"

echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "minio-*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "MinIO backup complete."
