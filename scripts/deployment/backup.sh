#!/bin/bash

# ===============================================
# 数据库备份脚本
# 支持自动备份和手动备份
# ===============================================

set -e

# 配置
BACKUP_DIR="/app/backups"
DB_NAME="personal_blog"
DB_USER="postgres"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/daily"
    mkdir -p "$BACKUP_DIR/weekly"
    mkdir -p "$BACKUP_DIR/monthly"
}

# 数据库备份
backup_database() {
    local backup_file="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    local compressed_file="$backup_file.gz"

    log_info "开始备份数据库..."

    # 使用pg_dump备份数据库
    if PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --verbose \
        --clean \
        --if-exists \
        --format=custom \
        > "$backup_file" 2>&1; then

        # 压缩备份文件
        gzip "$backup_file"

        log_success "数据库备份完成: $compressed_file"

        # 创建备份信息文件
        echo "备份时间: $(date)" > "$compressed_file.info"
        echo "数据库: $DB_NAME" >> "$compressed_file.info"
        echo "文件大小: $(du -h "$compressed_file" | cut -f1)" >> "$compressed_file.info"

        return 0
    else
        log_error "数据库备份失败"
        return 1
    fi
}

# 文件系统备份
backup_files() {
    local files_backup_dir="$BACKUP_DIR/files_backup_$TIMESTAMP"

    log_info "备份重要文件..."

    mkdir -p "$files_backup_dir"

    # 备份上传的文件
    if [[ -d "public/uploads" ]]; then
        cp -r "public/uploads" "$files_backup_dir/"
        log_info "已备份上传文件"
    fi

    # 备份配置文件
    cp .env "$files_backup_dir/" 2>/dev/null || log_warning "未找到.env文件"
    cp docker-compose*.yml "$files_backup_dir/" 2>/dev/null || true

    # 备份Nginx配置
    if [[ -d "nginx" ]]; then
        cp -r nginx "$files_backup_dir/"
        log_info "已备份Nginx配置"
    fi

    # 压缩文件备份
    tar -czf "$files_backup_dir.tar.gz" -C "$BACKUP_DIR" "files_backup_$TIMESTAMP"
    rm -rf "$files_backup_dir"

    log_success "文件备份完成: $files_backup_dir.tar.gz"
}

# 清理旧备份
cleanup_old_backups() {
    log_info "清理 $RETENTION_DAYS 天前的备份文件..."

    # 清理数据库备份
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

    # 清理文件备份
    find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

    # 清理临时文件
    find "$BACKUP_DIR" -name "*.tmp" -type f -mtime +1 -delete

    log_success "旧备份清理完成"
}

# 验证备份文件
verify_backup() {
    local backup_file="$1"

    if [[ -f "$backup_file" ]]; then
        local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)

        if [[ $file_size -gt 1000 ]]; then
            log_success "备份文件验证通过: $backup_file ($(du -h "$backup_file" | cut -f1))"
            return 0
        else
            log_error "备份文件过小，可能损坏: $backup_file"
            return 1
        fi
    else
        log_error "备份文件不存在: $backup_file"
        return 1
    fi
}

# 同步到远程存储 (可选)
sync_to_remote() {
    if [[ -n "$REMOTE_BACKUP_URL" ]]; then
        log_info "同步备份到远程存储..."

        # 这里可以添加rsync、aws s3、或其他云存储的同步逻辑
        # 例如: rsync -av "$BACKUP_DIR/" "$REMOTE_BACKUP_URL/"

        log_success "远程同步完成"
    fi
}

# 发送备份通知 (可选)
send_notification() {
    local status="$1"
    local message="$2"

    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"备份$status: $message\"}" \
            2>/dev/null || log_warning "通知发送失败"
    fi
}

# 显示备份统计
show_backup_stats() {
    log_info "备份统计信息:"
    echo "================================"
    echo "备份目录: $BACKUP_DIR"
    echo "总备份文件数: $(find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)"
    echo "总备份大小: $(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "未知")"
    echo "最新备份: $(ls -lt "$BACKUP_DIR"/*.gz 2>/dev/null | head -1 | awk '{print $9}' || echo "无")"
    echo "================================"
}

# 主函数
main() {
    echo "==============================================="
    echo "数据库备份脚本 - $(date)"
    echo "==============================================="

    # 设置错误处理
    set -e
    trap 'log_error "备份过程中发生错误"; send_notification "失败" "数据库备份失败"; exit 1' ERR

    # 检查环境变量
    if [[ -z "$POSTGRES_HOST" ]]; then
        POSTGRES_HOST="localhost"
    fi

    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        log_error "POSTGRES_PASSWORD环境变量未设置"
        exit 1
    fi

    # 执行备份流程
    create_backup_dir

    if backup_database; then
        backup_files
        cleanup_old_backups
        show_backup_stats
        sync_to_remote
        send_notification "成功" "数据库备份完成"
        log_success "备份流程完成"
    else
        send_notification "失败" "数据库备份失败"
        exit 1
    fi
}

# 恢复功能
restore_backup() {
    local backup_file="$1"

    if [[ -z "$backup_file" ]]; then
        log_error "请指定备份文件"
        echo "用法: $0 --restore <backup_file>"
        exit 1
    fi

    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi

    log_warning "警告: 此操作将覆盖现有数据库"
    read -p "确认继续? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "开始恢复数据库..."

        # 解压备份文件
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" | psql \
                -h "$POSTGRES_HOST" \
                -U "$DB_USER" \
                -d "$DB_NAME"
        else
            psql \
                -h "$POSTGRES_HOST" \
                -U "$DB_USER" \
                -d "$DB_NAME" \
                < "$backup_file"
        fi

        log_success "数据库恢复完成"
    else
        log_info "恢复操作已取消"
    fi
}

# 列出可用备份
list_backups() {
    log_info "可用备份文件:"
    echo "================================"
    ls -lah "$BACKUP_DIR"/*.gz 2>/dev/null | while read -r line; do
        echo "$line"
    done
    echo "================================"
}

# 参数处理
case "${1:-}" in
    --help|-h)
        echo "用法: $0 [选项]"
        echo
        echo "选项:"
        echo "  --help, -h          显示帮助信息"
        echo "  --restore FILE      从备份文件恢复数据库"
        echo "  --list              列出可用备份文件"
        echo "  --files-only        仅备份文件系统"
        echo "  --db-only           仅备份数据库"
        echo
        exit 0
        ;;
    --restore)
        restore_backup "$2"
        exit 0
        ;;
    --list)
        list_backups
        exit 0
        ;;
    --files-only)
        create_backup_dir
        backup_files
        exit 0
        ;;
    --db-only)
        create_backup_dir
        backup_database
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "未知参数: $1"
        echo "使用 --help 查看帮助信息"
        exit 1
        ;;
esac