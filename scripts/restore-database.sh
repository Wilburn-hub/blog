#!/bin/bash

# Personal Blog Database Restore Script
# This script restores the PostgreSQL database from a backup file

set -euo pipefail

# Configuration
DB_NAME="personal_blog"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/Users/liuweijia/Desktop/AI/personal-blog/backups"
LOG_FILE="${BACKUP_DIR}/restore.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS] <backup_file>"
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -l, --list           List available backups"
    echo "  -f, --force          Force restore without confirmation"
    echo "  -d, --dry-run        Show what would be restored without doing it"
    echo "  -s, --schema-only    Restore only schema (no data)"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 blog_backup_20231109_120000.sql.gz"
    echo "  $0 --force blog_backup_20231109_120000.sql.gz"
    echo "  $0 --dry-run blog_backup_20231109_120000.sql.gz"
}

# Function to list available backups
list_backups() {
    log "Available backups:"
    echo "=================================="

    if [ ! -d "$BACKUP_DIR" ]; then
        echo "No backup directory found."
        exit 1
    fi

    local backups=($(ls -1 "$BACKUP_DIR"/blog_backup_*.sql.gz 2>/dev/null | sort -r))

    if [ ${#backups[@]} -eq 0 ]; then
        echo "No backup files found."
        exit 1
    fi

    for i in "${!backups[@]}"; do
        local backup_file="${backups[$i]}"
        local basename=$(basename "$backup_file" .sql.gz)
        local file_size=$(du -h "$backup_file" | cut -f1)
        local mod_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup_file")

        printf "%2d. %s\n" $((i+1)) "$basename"
        printf "    Size: %s, Modified: %s\n" "$file_size" "$mod_date"

        # Check for metadata file
        local metadata_file="${BACKUP_DIR}/${basename}_metadata.json"
        if [ -f "$metadata_file" ]; then
            local db_size=$(jq -r '.database_size' "$metadata_file" 2>/dev/null || echo "Unknown")
            local table_count=$(jq -r '.table_count' "$metadata_file" 2>/dev/null || echo "Unknown")
            printf "    DB Size: %s, Tables: %s\n" "$db_size" "$table_count"
        fi
        echo ""
    done
}

# Function to check if PostgreSQL is running
check_postgres() {
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        log "ERROR: PostgreSQL is not running or not accessible"
        exit 1
    fi
}

# Function to validate backup file
validate_backup() {
    local backup_file=$1

    if [ ! -f "$backup_file" ]; then
        log "ERROR: Backup file not found: $backup_file"
        exit 1
    fi

    # Check if file is gzip compressed
    if ! file "$backup_file" | grep -q "gzip"; then
        log "ERROR: Backup file is not a valid gzip file: $backup_file"
        exit 1
    fi

    # Test gzip integrity
    if ! gzip -t "$backup_file" 2>/dev/null; then
        log "ERROR: Backup file integrity check failed: $backup_file"
        exit 1
    fi

    log "Backup file validation passed: $backup_file"
}

# Function to create backup before restore
create_pre_restore_backup() {
    local pre_restore_backup="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql"

    log "Creating pre-restore backup..."

    if PGPASSWORD="" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --create \
        --format=plain \
        "$DB_NAME" > "$pre_restore_backup" 2>> "$LOG_FILE"; then

        if gzip "$pre_restore_backup"; then
            log "Pre-restore backup created: ${pre_restore_backup}.gz"
        else
            log "WARNING: Failed to compress pre-restore backup"
        fi
    else
        log "WARNING: Failed to create pre-restore backup"
    fi
}

# Function to restore database
restore_database() {
    local backup_file=$1
    local schema_only=${2:-false}

    log "Starting database restore from: $backup_file"

    # Create temporary file for restore
    local temp_file=$(mktemp)
    trap "rm -f $temp_file" EXIT

    # Decompress backup to temporary file
    if ! gunzip -c "$backup_file" > "$temp_file"; then
        log "ERROR: Failed to decompress backup file"
        exit 1
    fi

    # Drop existing database and create new one
    log "Dropping existing database..."
    if ! dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>> "$LOG_FILE"; then
        log "WARNING: Failed to drop database (may not exist)"
    fi

    log "Creating new database..."
    if ! createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>> "$LOG_FILE"; then
        log "ERROR: Failed to create database"
        exit 1
    fi

    # Restore database
    log "Restoring database from backup..."
    if [ "$schema_only" = true ]; then
        # Schema only restore
        if ! sed '/COPY.*FROM stdin;/,/\\\.$/d' "$temp_file" | \
           sed '/^-- Data for Name:/d' | \
           PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>> "$LOG_FILE"; then
            log "ERROR: Failed to restore database schema"
            exit 1
        fi
        log "Database schema restored successfully"
    else
        # Full restore
        if ! PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" < "$temp_file" 2>> "$LOG_FILE"; then
            log "ERROR: Failed to restore database"
            exit 1
        fi
        log "Database restored successfully"
    fi
}

# Function to verify restore
verify_restore() {
    log "Verifying database restore..."

    # Check if database exists and has tables
    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    if [ -n "$table_count" ] && [ "$table_count" -gt 0 ]; then
        log "Restore verification successful: $table_count tables found"

        # Get basic statistics
        local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
        log "Database size: $db_size"

        return 0
    else
        log "ERROR: Restore verification failed - no tables found"
        return 1
    fi
}

# Function to confirm restore
confirm_restore() {
    local backup_file=$1

    echo "WARNING: This will completely replace the current database!"
    echo "Backup file: $(basename "$backup_file")"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirmation

    if [ "$confirmation" != "yes" ]; then
        log "Restore cancelled by user"
        exit 0
    fi
}

# Main function
main() {
    local backup_file=""
    local force_restore=false
    local dry_run=false
    local schema_only=false
    local list_only=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -l|--list)
                list_only=true
                shift
                ;;
            -f|--force)
                force_restore=true
                shift
                ;;
            -d|--dry-run)
                dry_run=true
                shift
                ;;
            -s|--schema-only)
                schema_only=true
                shift
                ;;
            -*)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                if [ -z "$backup_file" ]; then
                    backup_file="$1"
                else
                    echo "Multiple backup files specified"
                    usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Handle list option
    if [ "$list_only" = true ]; then
        list_backups
        exit 0
    fi

    # Check if backup file is specified
    if [ -z "$backup_file" ]; then
        echo "Error: Backup file is required"
        usage
        exit 1
    fi

    # Resolve backup file path
    if [ ! -f "$backup_file" ]; then
        # Try to find it in backup directory
        if [ -f "$BACKUP_DIR/$backup_file" ]; then
            backup_file="$BACKUP_DIR/$backup_file"
        else
            echo "Error: Backup file not found: $backup_file"
            exit 1
        fi
    fi

    log "=== Starting Database Restore Process ==="

    # Check prerequisites
    check_postgres
    validate_backup "$backup_file"

    # Handle dry run
    if [ "$dry_run" = true ]; then
        log "DRY RUN: Would restore from $(basename "$backup_file")"
        if [ "$schema_only" = true ]; then
            log "DRY RUN: Schema-only restore"
        else
            log "DRY RUN: Full restore (schema + data)"
        fi
        log "DRY RUN: Use --force to actually perform the restore"
        exit 0
    fi

    # Confirm restore unless forced
    if [ "$force_restore" = false ]; then
        confirm_restore "$backup_file"
    fi

    # Create pre-restore backup
    create_pre_restore_backup

    # Perform restore
    restore_database "$backup_file" "$schema_only"

    # Verify restore
    if verify_restore; then
        log "=== Database Restore Process Completed Successfully ==="

        if [ "$schema_only" = true ]; then
            log "Schema-only restore completed. You may need to restore data separately."
        else
            log "Full database restore completed."
        fi

        log "Pre-restore backup was created for safety."
    else
        log "=== Database Restore Process Failed ==="
        exit 1
    fi
}

# Handle script interruption
trap 'log "ERROR: Restore process interrupted"; exit 1' INT TERM

# Run main function
main "$@"