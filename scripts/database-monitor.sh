#!/bin/bash

# Personal Blog Database Monitoring Script
# This script monitors database performance and health

set -euo pipefail

# Configuration
DB_NAME="personal_blog"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/Users/liuweijia/Desktop/AI/personal-blog/backups"
LOG_FILE="${BACKUP_DIR}/monitor.log"
ALERT_LOG="${BACKUP_DIR}/alerts.log"
TEMP_DIR="/tmp/blog_monitor"

# Thresholds
CONNECTION_THRESHOLD=80          # % of max connections
DISK_SPACE_THRESHOLD=85         # % disk usage
SLOW_QUERY_THRESHOLD=1000       # milliseconds
VACUUM_THRESHOLD=100            # % dead tuple ratio
INDEX_SIZE_THRESHOLD=100        # MB for large indexes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories
mkdir -p "$BACKUP_DIR" "$TEMP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to log alerts
alert() {
    local severity=$1
    local message=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$severity] $message" | tee -a "$ALERT_LOG"

    case $severity in
        "CRITICAL")
            echo -e "${RED}🚨 CRITICAL: $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  WARNING: $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO: $message${NC}"
            ;;
    esac
}

# Function to check database connectivity
check_connectivity() {
    log "Checking database connectivity..."

    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        log "✅ Database is reachable"
        return 0
    else
        alert "CRITICAL" "Database is not reachable"
        return 1
    fi
}

# Function to check connection usage
check_connections() {
    log "Checking database connections..."

    local max_connections=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW max_connections;" | xargs)
    local current_connections=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)
    local usage_percent=$((current_connections * 100 / max_connections))

    echo "Connections: $current_connections/$max_connections (${usage_percent}%)"

    if [ $usage_percent -gt $CONNECTION_THRESHOLD ]; then
        alert "WARNING" "High connection usage: ${usage_percent}% (${current_connections}/${max_connections})"
    else
        log "✅ Connection usage is normal: ${usage_percent}%"
    fi

    # Check long-running queries
    local long_queries=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes' AND query NOT LIKE '%pg_stat_activity%';" | xargs)
    if [ "$long_queries" -gt 0 ]; then
        alert "WARNING" "Found $long_queries long-running queries"
    fi
}

# Function to check database size and growth
check_database_size() {
    log "Checking database size..."

    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
    local db_size_bytes=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_database_size('$DB_NAME');" | xargs)

    echo "Database size: $db_size"

    # Check table sizes
    echo "Top 10 largest tables:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT
            schemaname||'.'||tablename as table,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;"

    # Store size for trend analysis
    echo "$(date -Iseconds),$db_size_bytes" >> "$BACKUP_DIR/db_size_history.log"
}

# Function to check disk space
check_disk_space() {
    log "Checking disk space..."

    local db_data_dir=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SHOW data_directory;" | xargs)
    local disk_usage=$(df -h "$db_data_dir" | awk 'NR==2 {print $5}' | sed 's/%//')

    echo "Disk usage: ${disk_usage}%"

    if [ $disk_usage -gt $DISK_SPACE_THRESHOLD ]; then
        alert "CRITICAL" "Low disk space: ${disk_usage}% used"
    else
        log "✅ Disk space is sufficient: ${disk_usage}%"
    fi
}

# Function to check slow queries
check_slow_queries() {
    log "Checking for slow queries..."

    # Check pg_stat_statements if available
    local slow_queries=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*)
        FROM pg_stat_statements
        WHERE mean_time > $SLOW_QUERY_THRESHOLD
        LIMIT 1;" 2>/dev/null | xargs || echo "0")

    if [ "$slow_queries" -gt 0 ]; then
        alert "WARNING" "Found $slow_queries slow queries (avg > ${SLOW_QUERY_THRESHOLD}ms)"

        echo "Top 5 slowest queries:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            SELECT
                left(query, 80) as query_preview,
                round(mean_time::numeric, 2) as avg_time_ms,
                calls as call_count
            FROM pg_stat_statements
            WHERE mean_time > $SLOW_QUERY_THRESHOLD
            ORDER BY mean_time DESC
            LIMIT 5;" 2>/dev/null || echo "pg_stat_statements extension not available"
    else
        log "✅ No slow queries detected"
    fi
}

# Function to check table statistics
check_table_stats() {
    log "Checking table statistics..."

    echo "Table statistics:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT
            schemaname||'.'||tablename as table,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            round((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_pct,
            last_vacuum,
            last_autovacuum
        FROM pg_stat_user_tables
        ORDER BY dead_tup DESC
        LIMIT 10;"

    # Check tables that need vacuum
    local tables_need_vacuum=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*)
        FROM pg_stat_user_tables
        WHERE (n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100 > $VACUUM_THRESHOLD;" | xargs)

    if [ "$tables_need_vacuum" -gt 0 ]; then
        alert "WARNING" "$tables_need_vacuum tables need vacuuming (dead tuples > ${VACUUM_THRESHOLD}%)"
    fi
}

# Function to check index usage
check_index_usage() {
    log "Checking index usage..."

    echo "Index usage statistics:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT
            schemaname||'.'||tablename||'.'||indexname as index_name,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched,
            CASE
                WHEN idx_tup_read = 0 THEN 'UNUSED'
                WHEN idx_tup_fetch::float / idx_tup_read < 0.01 THEN 'LOW_USAGE'
                ELSE 'GOOD'
            END as usage_status
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read ASC
        LIMIT 10;"

    # Check unused indexes
    local unused_indexes=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*)
        FROM pg_stat_user_indexes
        WHERE idx_tup_read = 0;" | xargs)

    if [ "$unused_indexes" -gt 0 ]; then
        alert "WARNING" "Found $unused_indexes unused indexes that may be wasting space"
    fi

    # Check large indexes
    local large_indexes=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*)
        FROM pg_indexes i
        JOIN pg_class c ON i.indexname = c.relname
        WHERE pg_relation_size(c.oid) > $INDEX_SIZE_THRESHOLD * 1024 * 1024;" | xargs)

    if [ "$large_indexes" -gt 0 ]; then
        log "ℹ️  Found $large_indexes large indexes (> ${INDEX_SIZE_THRESHOLD}MB)"
    fi
}

# Function to check cache hit ratio
check_cache_performance() {
    log "Checking cache performance..."

    local buffer_hit_ratio=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT round(sum(blks_hit)::float / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100, 2)
        FROM pg_stat_database;" | xargs)

    echo "Buffer cache hit ratio: ${buffer_hit_ratio}%"

    if (( $(echo "$buffer_hit_ratio < 90" | bc -l) )); then
        alert "WARNING" "Low buffer cache hit ratio: ${buffer_hit_ratio}% (should be > 90%)"
    else
        log "✅ Good buffer cache hit ratio: ${buffer_hit_ratio}%"
    fi
}

# Function to check locks
check_locks() {
    log "Checking for locks..."

    local lock_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_locks WHERE NOT granted;" | xargs)

    if [ "$lock_count" -gt 0 ]; then
        alert "WARNING" "Found $lock_count ungranted locks"

        echo "Current locks:"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            SELECT
                l.pid,
                a.usename,
                a.query,
                l.mode,
                l.granted
            FROM pg_locks l
            JOIN pg_stat_activity a ON l.pid = a.pid
            WHERE NOT l.granted
            ORDER BY l.pid;"
    else
        log "✅ No blocking locks found"
    fi
}

# Function to generate performance report
generate_report() {
    local report_file="${BACKUP_DIR}/performance_report_$(date +%Y%m%d_%H%M%S).txt"

    log "Generating performance report: $report_file"

    {
        echo "=== Personal Blog Database Performance Report ==="
        echo "Generated: $(date)"
        echo "Database: $DB_NAME"
        echo "============================================="
        echo ""

        # Database overview
        echo "=== Database Overview ==="
        echo "Size: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)"
        echo "Connections: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity;" | xargs)"
        echo "Tables: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)"
        echo "Indexes: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';" | xargs)"
        echo ""

        # Performance metrics
        echo "=== Performance Metrics ==="
        echo "Buffer Cache Hit Ratio: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT round(sum(blks_hit)::float / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100, 2) FROM pg_stat_database;" | xargs)%"
        echo "Active Connections: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)"
        echo "Locks: $(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM pg_locks WHERE NOT granted;" | xargs) ungranted"
        echo ""

        # Recent alerts
        echo "=== Recent Alerts (Last 24 Hours) ==="
        if [ -f "$ALERT_LOG" ]; then
            grep "$(date -d '1 day ago' '+%Y-%m-%d')" "$ALERT_LOG" || echo "No alerts in the last 24 hours"
        else
            echo "No alert log found"
        fi
        echo ""

    } > "$report_file"

    log "Performance report generated: $report_file"
}

# Function to perform health check
health_check() {
    local overall_status="HEALTHY"

    echo -e "${BLUE}=== Database Health Check ===${NC}"
    echo ""

    if ! check_connectivity; then
        overall_status="UNHEALTHY"
    fi

    check_connections
    check_database_size
    check_disk_space
    check_cache_performance
    check_locks

    echo ""
    if [ "$overall_status" = "HEALTHY" ]; then
        echo -e "${GREEN}✅ Overall Status: $overall_status${NC}"
    else
        echo -e "${RED}❌ Overall Status: $overall_status${NC}"
    fi
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -q, --quick         Quick health check only"
    echo "  -r, --report        Generate performance report"
    echo "  -f, --full          Full monitoring check (default)"
    echo "  --health-only       Health check without detailed analysis"
    echo ""
    echo "Examples:"
    echo "  $0                  # Full monitoring check"
    echo "  $0 --quick          # Quick check"
    echo "  $0 --report         # Generate report only"
    echo "  $0 --health-only    # Health check only"
}

# Main function
main() {
    local quick_check=false
    local generate_report_only=false
    local health_check_only=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -q|--quick)
                quick_check=true
                shift
                ;;
            -r|--report)
                generate_report_only=true
                shift
                ;;
            --health-only)
                health_check_only=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    log "=== Starting Database Monitoring ==="

    if [ "$generate_report_only" = true ]; then
        generate_report
        exit 0
    fi

    if [ "$health_check_only" = true ]; then
        health_check
        exit 0
    fi

    # Check connectivity first
    if ! check_connectivity; then
        exit 1
    fi

    if [ "$quick_check" = true ]; then
        health_check
        exit 0
    fi

    # Full monitoring check
    check_connections
    check_database_size
    check_disk_space
    check_slow_queries
    check_table_stats
    check_index_usage
    check_cache_performance
    check_locks

    # Generate report
    generate_report

    log "=== Database Monitoring Completed ==="
}

# Handle script interruption
trap 'log "ERROR: Monitoring process interrupted"; exit 1' INT TERM

# Run main function
main "$@"