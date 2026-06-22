#!/bin/bash
# Database backup script
# Run via cron: 0 2 * * * /opt/restaurantos/scripts/backup.sh

set -e

BACKUP_DIR="/opt/restaurantos/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

echo "Starting backup: $DATE"

# Dump database
docker compose -f /opt/restaurantos/docker-compose.prod.yml exec -T postgres \
  pg_dump -U "${DB_USER:-restaurantos}" restaurantos | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

echo "Backup created: db_$DATE.sql.gz ($(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1))"

# Remove old backups
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "Cleaned backups older than $KEEP_DAYS days"

echo "Backup complete"
