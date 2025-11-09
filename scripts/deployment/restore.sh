#!/bin/bash

# ===============================================
# 数据恢复脚本
# 用于从备份恢复数据库和文件
# ===============================================

set -e

# 配置
BACKUP_DIR="/app/backups"
DB_NAME="personal_blog"
DB_USER="postgres"

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

# 检查备份文件
check_backup_file() {
    local backup_file="$1"

    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        return 1
    fi

    if [[ ! -r "$backup_file" ]]; then
        log_error "无法读取备份文件: $backup_file"
        return 1
    fi

    # 检查文件大小
    local file_size
    file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null)

    if [[ $file_size -lt 1000 ]]; then
        log_error "备份文件过小，可能损坏: $backup_file"
        return 1
    fi

    log_success "备份文件验证通过: $backup_file"
    return 0
}

# 列出可用备份
list_available_backups() {
    log_info "可用的数据库备份文件:"
    echo "================================"

    local index=1
    declare -a backup_files

    while IFS= read -r -d '' file; do
        backup_files+=("$file")
        echo "  $index) $(basename "$file") ($(du -h "$file" | cut -f1)) - $(stat -f%Sm "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null)"
        index=$((index + 1))
    done < <(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -print0 | sort -z)

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_warning "未找到备份文件"
        return 1
    fi

    echo "================================"
    return 0
}

# 选择备份文件
select_backup() {
    if [[ -n "$SELECTED_BACKUP" ]]; then
        check_backup_file "$SELECTED_BACKUP"
        return $?
    fi

    list_available_backups || return 1

    local backup_count
    backup_count=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | wc -l)

    if [[ $backup_count -eq 0 ]]; then
        log_error "没有可用的备份文件"
        return 1
    fi

    while true; do
        read -p "请选择要恢复的备份文件 (1-$backup_count): " selection

        if [[ "$selection" =~ ^[0-9]+$ ]] && [[ $selection -ge 1 ]] && [[ $selection -le $backup_count ]]; then
            SELECTED_BACKUP=$(find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f | sed -n "${selection}p")
            check_backup_file "$SELECTED_BACKUP"
            return $?
        else
            log_warning "无效的选择，请输入 1-$backup_count 之间的数字"
        fi
    done
}

# 创建恢复前备份
create_pre_restore_backup() {
    log_info "创建恢复前备份..."

    local pre_restore_backup="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql"

    if docker-compose exec -T db pg_dump -U postgres "$DB_NAME" > "$pre_restore_backup" 2>/dev/null; then
        gzip "$pre_restore_backup"
        log_success "恢复前备份创建完成: ${pre_restore_backup}.gz"
        return 0
    else
        log_warning "无法创建恢复前备份"
        return 1
    fi
}

# 恢复数据库
restore_database() {
    local backup_file="$1"

    log_info "开始恢复数据库..."

    # 检查数据库连接
    if ! docker-compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        log_error "数据库连接失败，请确保数据库服务正在运行"
        return 1
    fi

    # 停止应用服务以避免数据冲突
    log_info "停止应用服务..."
    docker-compose stop app || true

    # 删除现有数据库
    log_info "删除现有数据库..."
    docker-compose exec -T db dropdb -U postgres "$DB_NAME" 2>/dev/null || true

    # 创建新数据库
    log_info "创建新数据库..."
    docker-compose exec -T db createdb -U postgres "$DB_NAME"

    # 恢复数据
    log_info "恢复数据中..."

    if [[ "$backup_file" == *.gz ]]; then
        # 解压并恢复
        if gunzip -c "$backup_file" | docker-compose exec -T db psql -U postgres "$DB_NAME"; then
            log_success "数据库恢复成功"
        else
            log_error "数据库恢复失败"
            return 1
        fi
    else
        # 直接恢复
        if docker-compose exec -T db psql -U postgres "$DB_NAME" < "$backup_file"; then
            log_success "数据库恢复成功"
        else
            log_error "数据库恢复失败"
            return 1
        fi
    fi

    # 运行数据库迁移 (确保Schema是最新的)
    log_info "运行数据库迁移..."
    docker-compose run --rm app npx prisma migrate deploy

    # 重新启动应用服务
    log_info "重新启动应用服务..."
    docker-compose start app

    # 等待应用启动
    sleep 10

    # 验证恢复
    if verify_restore; then
        log_success "数据库恢复完成并验证通过"
        return 0
    else
        log_error "数据库恢复验证失败"
        return 1
    fi
}

# 恢复文件
restore_files() {
    local files_backup="$1"

    log_info "恢复文件..."

    if [[ ! -f "$files_backup" ]]; then
        log_warning "文件备份不存在: $files_backup"
        return 1
    fi

    # 创建临时目录
    local temp_dir
    temp_dir=$(mktemp -d)

    # 解压文件备份
    if tar -xzf "$files_backup" -C "$temp_dir"; then
        # 恢复上传文件
        if [[ -d "$temp_dir/files_backup_"*"/uploads" ]]; then
            log_info "恢复上传文件..."
            rm -rf public/uploads 2>/dev/null || true
            cp -r "$temp_dir/files_backup_"*"/uploads" public/
        fi

        # 恢复配置文件 (可选)
        if [[ "$RESTORE_CONFIG" == "true" ]]; then
            log_info "恢复配置文件..."
            find "$temp_dir/files_backup_"* -maxdepth 1 -type f \( -name ".env" -o -name "*.yml" \) -exec cp {} . \;
        fi

        log_success "文件恢复完成"
    else
        log_error "文件恢复失败"
        return 1
    fi

    # 清理临时目录
    rm -rf "$temp_dir"
}

# 验证恢复
verify_restore() {
    log_info "验证恢复结果..."

    # 检查数据库连接
    if ! docker-compose exec -T db pg_isready -U postgres -d "$DB_NAME" >/dev/null 2>&1; then
        log_error "数据库连接验证失败"
        return 1
    fi

    # 检查应用健康状态
    local max_retries=5
    local retry_count=0

    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "应用健康检查通过"
            break
        else
            retry_count=$((retry_count + 1))
            log_info "等待应用启动... ($retry_count/$max_retries)"
            sleep 10
        fi
    done

    if [[ $retry_count -eq $max_retries ]]; then
        log_error "应用启动验证失败"
        return 1
    fi

    # 检查数据库表
    local table_count
    table_count=$(docker-compose exec -T db psql -U postgres -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

    if [[ $table_count -gt 0 ]]; then
        log_success "数据库验证通过 (找到 $table_count 个表)"
        return 0
    else
        log_error "数据库验证失败 (没有找到表)"
        return 1
    fi
}

# 显示恢复信息
show_restore_info() {
    echo "==============================================="
    echo "数据恢复完成"
    echo "==============================================="
    echo "恢复时间: $(date)"
    echo "备份文件: $SELECTED_BACKUP"
    echo
    echo "验证结果:"
    if [[ $? -eq 0 ]]; then
        echo "✅ 数据库连接正常"
        echo "✅ 应用服务正常"
        echo "✅ 数据完整性验证通过"
    else
        echo "❌ 恢复验证失败"
    fi
    echo
    echo "服务状态:"
    docker-compose ps
    echo "==============================================="
}

# 主函数
main() {
    echo "==============================================="
    echo "数据恢复脚本 - $(date)"
    echo "==============================================="
    echo

    # 安全确认
    log_warning "警告: 此操作将覆盖现有数据"
    read -p "确认继续数据恢复操作? (y/N): " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "恢复操作已取消"
        exit 0
    fi

    # 检查环境变量
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        log_error "POSTGRES_PASSWORD环境变量未设置"
        exit 1
    fi

    # 执行恢复流程
    select_backup || exit 1

    if [[ "$CREATE_PRE_BACKUP" != "false" ]]; then
        create_pre_restore_backup
    fi

    if restore_database "$SELECTED_BACKUP"; then
        # 如果有文件备份，也恢复文件
        local files_backup
        files_backup=$(find "$BACKUP_DIR" -name "files_backup_*.tar.gz" -type f | head -1)

        if [[ -n "$files_backup" ]]; then
            read -p "是否同时恢复文件备份? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                restore_files "$files_backup"
            fi
        fi

        show_restore_info
        log_success "数据恢复流程完成"
    else
        log_error "数据恢复失败"
        exit 1
    fi
}

# 参数处理
case "${1:-}" in
    --help|-h)
        echo "用法: $0 [选项] [备份文件]"
        echo
        echo "选项:"
        echo "  --help, -h              显示帮助信息"
        echo "  --list                  列出可用备份文件"
        echo "  --no-pre-backup        不创建恢复前备份"
        echo "  --restore-config        同时恢复配置文件"
        echo "  backup_file            直接指定备份文件"
        echo
        echo "示例:"
        echo "  $0 --list                             # 列出备份文件"
        echo "  $0 /path/to/backup.sql.gz             # 恢复指定备份"
        echo "  $0 --no-pre-backup backup.sql.gz     # 不创建恢复前备份"
        echo
        exit 0
        ;;
    --list)
        list_available_backups
        exit 0
        ;;
    --no-pre-backup)
        CREATE_PRE_BACKUP="false"
        shift
        ;;
    --restore-config)
        RESTORE_CONFIG="true"
        shift
        ;;
    "")
        main
        ;;
    *)
        if [[ -f "$1" ]]; then
            SELECTED_BACKUP="$1"
            main
        else
            log_error "备份文件不存在: $1"
            echo "使用 --help 查看帮助信息"
            exit 1
        fi
        ;;
esac