#!/bin/bash

# ===============================================
# 个人博客一键部署脚本
# 作者: DevOps Engineer
# 版本: 1.0.0
# ===============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
}

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查系统依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    log_success "系统依赖检查通过"
}

# 检查环境变量文件
check_env_file() {
    log_info "检查环境变量文件..."

    if [[ ! -f .env ]]; then
        log_warning ".env文件不存在，正在从.env.example创建..."
        if [[ -f .env.example ]]; then
            cp .env.example .env
            log_warning "请编辑.env文件并填入正确的配置值"
            log_info "使用命令: nano .env"
            read -p "是否现在编辑.env文件? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                nano .env
            fi
        else
            log_error ".env.example文件不存在"
            exit 1
        fi
    fi

    log_success "环境变量文件检查完成"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."

    mkdir -p logs/nginx
    mkdir -p backups
    mkdir -p nginx/ssl
    mkdir -p nginx/certbot-webroot

    log_success "目录创建完成"
}

# 备份当前数据
backup_data() {
    log_info "备份当前数据..."

    if docker-compose ps | grep -q "db"; then
        BACKUP_FILE="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql"
        docker-compose exec -T db pg_dump -U postgres personal_blog > "$BACKUP_FILE"
        log_success "数据备份完成: $BACKUP_FILE"
    else
        log_warning "数据库未运行，跳过备份"
    fi
}

# 构建和启动服务
deploy_services() {
    log_info "构建和启动服务..."

    # 停止现有服务
    if docker-compose ps | grep -q "Up"; then
        log_info "停止现有服务..."
        docker-compose down
    fi

    # 拉取最新代码
    log_info "拉取最新代码..."
    git pull origin main

    # 构建镜像
    log_info "构建Docker镜像..."
    docker-compose build --no-cache

    # 启动服务
    log_info "启动服务..."
    docker-compose up -d

    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30

    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_info "检查服务健康状态..."

    # 检查应用服务
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "应用服务健康检查通过"
    else
        log_error "应用服务健康检查失败"
        return 1
    fi

    # 检查数据库连接
    if docker-compose exec -T db pg_isready -U postgres -d personal_blog &> /dev/null; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败"
        return 1
    fi

    # 检查Redis连接
    if docker-compose exec -T redis redis-cli ping &> /dev/null; then
        log_success "Redis连接正常"
    else
        log_error "Redis连接失败"
        return 1
    fi

    log_success "所有服务健康检查通过"
}

# 运行数据库迁移
run_migrations() {
    log_info "运行数据库迁移..."

    docker-compose exec app npx prisma migrate deploy

    log_success "数据库迁移完成"
}

# 清理旧镜像和容器
cleanup() {
    log_info "清理旧镜像和容器..."

    # 清理未使用的镜像
    docker image prune -f

    # 清理未使用的容器
    docker container prune -f

    log_success "清理完成"
}

# 显示部署信息
show_deployment_info() {
    log_info "部署完成！"
    echo
    echo "==============================================="
    echo "部署信息"
    echo "==============================================="
    echo "应用地址: http://localhost:3000"
    echo "数据库地址: localhost:5432"
    echo "Redis地址: localhost:6379"
    echo
    echo "管理命令:"
    echo "  查看日志: docker-compose logs -f"
    echo "  查看状态: docker-compose ps"
    echo "  停止服务: docker-compose down"
    echo "  重启服务: docker-compose restart"
    echo "  数据库管理: docker-compose exec db psql -U postgres -d personal_blog"
    echo "==============================================="
}

# 错误处理
handle_error() {
    log_error "部署过程中发生错误"
    log_info "查看详细日志: docker-compose logs"
    exit 1
}

# 主函数
main() {
    echo "==============================================="
    echo "个人博客一键部署脚本"
    echo "==============================================="
    echo

    # 设置错误处理
    trap handle_error ERR

    # 执行部署步骤
    check_root
    check_dependencies
    check_env_file
    create_directories
    backup_data
    deploy_services
    run_migrations
    cleanup
    show_deployment_info

    log_success "部署完成！"
}

# 脚本参数处理
case "${1:-}" in
    --help|-h)
        echo "用法: $0 [选项]"
        echo
        echo "选项:"
        echo "  --help, -h      显示帮助信息"
        echo "  --ssl           启用SSL部署"
        echo "  --dev           开发环境部署"
        echo "  --backup-only   仅备份数据"
        echo "  --update        更新现有部署"
        echo
        exit 0
        ;;
    --ssl)
        log_info "使用SSL配置部署..."
        docker-compose -f docker-compose.ssl.yml up -d
        exit 0
        ;;
    --dev)
        log_info "开发环境部署..."
        docker-compose --profile dev up -d
        exit 0
        ;;
    --backup-only)
        backup_data
        exit 0
        ;;
    --update)
        log_info "更新现有部署..."
        backup_data
        docker-compose pull
        docker-compose up -d
        check_services_health
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