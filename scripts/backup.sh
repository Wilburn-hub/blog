#!/bin/bash

# Database Backup Script
# This script creates backups of the PostgreSQL database

set -e

# Configuration
DB_CONTAINER="personal-blog_db_1"
DB_USER="postgres"
DB_NAME="personal_blog"
BACKUP_DIR="/Users/liuweijia/Desktop/AI/personal-blog/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️ Starting database backup..."

# Create backup
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "🧹 Old backups cleaned up"