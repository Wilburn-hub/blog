#!/bin/bash

# ===============================================
# 服务监控脚本
# 监控应用、数据库和缓存的健康状态
# ===============================================

set -e

# 配置
LOG_FILE="/app/logs/monitor.log"
ALERT_THRESHOLD=3
CHECK_INTERVAL=60

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

# 创建日志目录
create_log_dir() {
    mkdir -p "$(dirname "$LOG_FILE")"
}

# 检查Docker服务状态
check_docker_services() {
    log_info "检查Docker服务状态..."

    local failed_services=()

    while IFS= read -r service; do
        if ! docker-compose ps "$service" | grep -q "Up"; then
            failed_services+=("$service")
            log_error "服务未运行: $service"
        fi
    done < <(docker-compose config --services)

    if [[ ${#failed_services[@]} -eq 0 ]]; then
        log_success "所有Docker服务运行正常"
        return 0
    else
        return 1
    fi
}

# 检查应用健康状态
check_app_health() {
    log_info "检查应用健康状态..."

    local max_retries=3
    local retry_count=0

    while [[ $retry_count -lt $max_retries ]]; do
        if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "应用健康检查通过"
            return 0
        else
            retry_count=$((retry_count + 1))
            log_warning "应用健康检查失败，重试 $retry_count/$max_retries"
            sleep 5
        fi
    done

    log_error "应用健康检查失败"
    return 1
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."

    if docker-compose exec -T db pg_isready -U postgres -d personal_blog >/dev/null 2>&1; then
        log_success "数据库连接正常"
        return 0
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 检查Redis连接
check_redis() {
    log_info "检查Redis连接..."

    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis连接正常"
        return 0
    else
        log_error "Redis连接失败"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_info "检查磁盘空间..."

    local threshold=80
    local usage

    usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [[ $usage -gt $threshold ]]; then
        log_warning "磁盘使用率过高: ${usage}%"
        return 1
    else
        log_success "磁盘空间充足: ${usage}%"
        return 0
    fi
}

# 检查内存使用
check_memory() {
    log_info "检查内存使用..."

    local threshold=90
    local usage

    # 获取系统内存使用率
    usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

    if [[ $usage -gt $threshold ]]; then
        log_warning "内存使用率过高: ${usage}%"
        return 1
    else
        log_success "内存使用正常: ${usage}%"
        return 0
    fi
}

# 检查SSL证书有效期
check_ssl_certificate() {
    log_info "检查SSL证书有效期..."

    if [[ -f "/etc/nginx/ssl/fullchain.pem" ]]; then
        local expiry_date
        local days_left

        expiry_date=$(openssl x509 -in /etc/nginx/ssl/fullchain.pem -noout -enddate | cut -d= -f2)
        days_left=$(( ($(date -d "$expiry_date" +%s) - $(date +%s)) / 86400 ))

        if [[ $days_left -lt 30 ]]; then
            log_warning "SSL证书将在 $days_left 天后过期"
            return 1
        else
            log_success "SSL证书有效期充足: $days_left 天"
            return 0
        fi
    else
        log_warning "未找到SSL证书文件"
        return 1
    fi
}

# 检查Nginx配置
check_nginx_config() {
    log_info "检查Nginx配置..."

    if docker-compose exec -T nginx nginx -t >/dev/null 2>&1; then
        log_success "Nginx配置正确"
        return 0
    else
        log_error "Nginx配置错误"
        return 1
    fi
}

# 获取系统负载
get_system_load() {
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

    echo "$load_avg"
}

# 检查系统负载
check_system_load() {
    log_info "检查系统负载..."

    local load
    load=$(get_system_load)

    # 获取CPU核心数
    local cpu_cores
    cpu_cores=$(nproc)

    # 计算负载阈值 (CPU核心数的2倍)
    local threshold
    threshold=$(echo "$cpu_cores * 2" | bc)

    if (( $(echo "$load > $threshold" | bc -l) )); then
        log_warning "系统负载过高: $load (阈值: $threshold)"
        return 1
    else
        log_success "系统负载正常: $load"
        return 0
    fi
}

# 发送告警通知
send_alert() {
    local message="$1"
    local severity="$2"

    log_error "发送告警: $message"

    # 这里可以添加各种通知方式
    # 邮件通知
    if [[ -n "$ALERT_EMAIL" ]]; then
        echo "$message" | mail -s "[$severity] 博客监控告警" "$ALERT_EMAIL" 2>/dev/null || true
    fi

    # Webhook通知
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST "$WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[$severity] $message\"}" \
            2>/dev/null || true
    fi

    # 钉钉通知
    if [[ -n "$DINGTALK_WEBHOOK" ]]; then
        curl -X POST "$DINGTALK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"msgtype\":\"text\",\"text\":{\"content\":\"$message\"}}" \
            2>/dev/null || true
    fi
}

# 重启故障服务
restart_failed_service() {
    local service="$1"

    log_info "尝试重启服务: $service"

    if docker-compose restart "$service"; then
        sleep 10
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "服务重启成功: $service"
            return 0
        else
            log_error "服务重启失败: $service"
            return 1
        fi
    else
        log_error "无法重启服务: $service"
        return 1
    fi
}

# 生成监控报告
generate_report() {
    local report_file="/app/logs/monitor_report_$(date +%Y%m%d_%H%M%S).txt"

    log_info "生成监控报告..."

    {
        echo "==============================================="
        echo "系统监控报告 - $(date)"
        echo "==============================================="
        echo
        echo "系统信息:"
        echo "  主机名: $(hostname)"
        echo "  操作系统: $(uname -s -r)"
        echo "  运行时间: $(uptime -p 2>/dev/null || uptime)"
        echo "  系统负载: $(get_system_load)"
        echo
        echo "磁盘使用:"
        df -h
        echo
        echo "内存使用:"
        free -h
        echo
        echo "Docker服务状态:"
        docker-compose ps
        echo
        echo "最近的监控日志:"
        tail -n 20 "$LOG_FILE"
    } > "$report_file"

    log_success "监控报告已生成: $report_file"
}

# 主监控函数
run_monitoring() {
    local failed_checks=0

    create_log_dir

    log_info "开始系统监控检查..."

    # 执行各项检查
    if ! check_docker_services; then
        failed_checks=$((failed_checks + 1))
    fi

    if ! check_app_health; then
        failed_checks=$((failed_checks + 1))
        # 尝试重启应用服务
        restart_failed_service "app"
    fi

    if ! check_database; then
        failed_checks=$((failed_checks + 1))
        # 尝试重启数据库服务
        restart_failed_service "db"
    fi

    if ! check_redis; then
        failed_checks=$((failed_checks + 1))
        # 尝试重启Redis服务
        restart_failed_service "redis"
    fi

    # 系统资源检查
    check_disk_space || failed_checks=$((failed_checks + 1))
    check_memory || failed_checks=$((failed_checks + 1))
    check_system_load || failed_checks=$((failed_checks + 1))

    # SSL和Nginx检查
    check_ssl_certificate || failed_checks=$((failed_checks + 1))
    check_nginx_config || failed_checks=$((failed_checks + 1))

    # 根据检查结果决定是否发送告警
    if [[ $failed_checks -ge $ALERT_THRESHOLD ]]; then
        send_alert "系统监控发现 $failed_checks 个问题" "ERROR"
    elif [[ $failed_checks -gt 0 ]]; then
        send_alert "系统监控发现 $failed_checks 个警告" "WARNING"
    else
        log_success "所有监控检查通过"
    fi

    return $failed_checks
}

# 持续监控模式
continuous_monitoring() {
    log_info "启动持续监控模式 (每${CHECK_INTERVAL}秒检查一次)..."

    while true; do
        run_monitoring
        sleep "$CHECK_INTERVAL"
    done
}

# 主函数
main() {
    echo "==============================================="
    echo "系统监控脚本 - $(date)"
    echo "==============================================="

    case "${1:-}" in
        --continuous|-c)
            continuous_monitoring
            ;;
        --report|-r)
            generate_report
            ;;
        --once|-o)
            run_monitoring
            ;;
        --help|-h)
            echo "用法: $0 [选项]"
            echo
            echo "选项:"
            echo "  --help, -h          显示帮助信息"
            echo "  --continuous, -c    持续监控模式"
            echo "  --once, -o          执行一次检查"
            echo "  --report, -r        生成监控报告"
            echo
            exit 0
            ;;
        *)
            run_monitoring
            ;;
    esac
}

# 执行主函数
main "$@"