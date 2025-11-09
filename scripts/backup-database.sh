#!/bin/bash

# Personal Blog Database Backup Script
# This script creates automated backups of the PostgreSQL database with retention policies

set -euo pipefail

# Configuration
DB_NAME="personal_blog"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/Users/liuweijia/Desktop/AI/personal-blog/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/blog_backup_${DATE}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if PostgreSQL is running
check_postgres() {
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        log "ERROR: PostgreSQL is not running or not accessible"
        exit 1
    fi
}

# Function to create backup
create_backup() {
    log "Starting database backup..."

    # Create SQL backup
    if PGPASSWORD="" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        --no-owner \
        --no-privileges \
        --disable-triggers \
        --exclude-table-data='_prisma_migrations' \
        "$DB_NAME" > "$BACKUP_FILE" 2>> "$LOG_FILE"; then

        log "Database backup created successfully: $BACKUP_FILE"

        # Compress the backup
        if gzip "$BACKUP_FILE"; then
            log "Backup compressed successfully: $COMPRESSED_FILE"

            # Get file size
            local file_size=$(du -h "$COMPRESSED_FILE" | cut -f1)
            log "Backup file size: $file_size"
        else
            log "ERROR: Failed to compress backup file"
            exit 1
        fi
    else
        log "ERROR: Failed to create database backup"
        exit 1
    fi
}

# Function to create schema-only backup
create_schema_backup() {
    local schema_backup_file="${BACKUP_DIR}/blog_schema_${DATE}.sql"

    log "Creating schema-only backup..."

    if PGPASSWORD="" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        --no-password \
        --verbose \
        --schema-only \
        --no-owner \
        --no-privileges \
        "$DB_NAME" > "$schema_backup_file" 2>> "$LOG_FILE"; then

        log "Schema backup created successfully: $schema_backup_file"

        # Compress schema backup
        if gzip "$schema_backup_file"; then
            log "Schema backup compressed successfully: ${schema_backup_file}.gz"
        fi
    else
        log "WARNING: Failed to create schema backup"
    fi
}

# Function to clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_files=0
    local total_files_before=$(find "$BACKUP_DIR" -name "blog_backup_*.sql.gz" | wc -l)

    # Delete old backup files
    find "$BACKUP_DIR" -name "blog_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

    # Delete old schema files
    find "$BACKUP_DIR" -name "blog_schema_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

    local total_files_after=$(find "$BACKUP_DIR" -name "blog_backup_*.sql.gz" | wc -l)
    deleted_files=$((total_files_before - total_files_after))

    log "Deleted $deleted_files old backup files"
}

# Function to verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    if gzip -t "$COMPRESSED_FILE" 2>> "$LOG_FILE"; then
        log "Backup integrity verified successfully"
        return 0
    else
        log "ERROR: Backup integrity check failed"
        return 1
    fi
}

# Function to create backup metadata
create_metadata() {
    local metadata_file="${BACKUP_DIR}/blog_backup_${DATE}_metadata.json"

    log "Creating backup metadata..."

    # Get database statistics
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    local backup_size=$(du -h "$COMPRESSED_FILE" | cut -f1)

    cat > "$metadata_file" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "database_name": "$DB_NAME",
    "database_size": "$db_size",
    "table_count": "$table_count",
    "backup_file": "$(basename "$COMPRESSED_FILE")",
    "backup_size": "$backup_size",
    "backup_type": "full",
    "compression": "gzip",
    "retention_days": $RETENTION_DAYS
}
EOF

    log "Backup metadata created: $metadata_file"
}

# Function to send notification (optional)
send_notification() {
    local status=$1
    local message=$2

    # You can implement email, Slack, or other notifications here
    log "Notification: $status - $message"
}

# Main backup process
main() {
    log "=== Starting Database Backup Process ==="

    # Check prerequisites
    check_postgres

    # Create backups
    create_backup
    create_schema_backup

    # Verify backup
    if verify_backup; then
        create_metadata
        cleanup_old_backups

        log "=== Backup Process Completed Successfully ==="
        send_notification "SUCCESS" "Database backup completed: $COMPRESSED_FILE"
    else
        log "=== Backup Process Failed ==="
        send_notification "ERROR" "Database backup verification failed"
        exit 1
    fi
}

# Handle script interruption
trap 'log "ERROR: Backup process interrupted"; exit 1' INT TERM

# Run main function
main "$@"