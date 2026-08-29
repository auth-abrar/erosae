#!/usr/bin/env bash
# ==============================================================================
# Erosae.com Automated Database Backup Script
# ==============================================================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

if [ -f "./prisma/dev.db" ]; then
  BACKUP_FILE="$BACKUP_DIR/erosae_db_backup_$TIMESTAMP.db"
  cp ./prisma/dev.db "$BACKUP_FILE"
  echo "✅ SQLite database backup created: $BACKUP_FILE"
else
  echo "ℹ️ External SQL Database configured via DATABASE_URL."
fi

# Retain only the last 30 backups
find "$BACKUP_DIR" -type f -name "*.db" -mtime +30 -delete 2>/dev/null || true
echo "🧹 Old backups pruned (30 days retention policy)."
