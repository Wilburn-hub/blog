#!/bin/bash

# 文档索引生成脚本
# 显示项目文档结构和快速导航

set -e

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 个人博客项目文档索引${NC}"
echo -e "${CYAN}=============================================${NC}"
echo

# 函数：显示文档目录
show_docs_dir() {
    local dir=$1
    local title=$2
    local icon=$3

    echo -e "${icon} ${title}${NC}"
    find "docs/$dir" -name "*.md" -not -name "STRUCTURE.md" | sort | while read file; do
        # 提取文件名（去掉路径和扩展名）
        filename=$(basename "$file" .md)

        # 读取文件的第一行作为标题
        title=$(head -n 1 "$file" | sed 's/^# //' | sed 's/^#//' | xargs)

        # 计算相对路径
        rel_path=$(echo "$file" | sed 's|^docs/||')

        echo -e "  📄 [${title}](${rel_path})"
    done
    echo
}

# 显示根目录 README
echo -e "${YELLOW}📋 主要文档${NC}"
echo -e "  📄 [项目 README](../README.md) - 项目概述和快速开始"
echo

# 显示各个分类
show_docs_dir "setup" "🚀 设置和配置" "${GREEN}"
show_docs_dir "development" "💻 开发相关" "${GREEN}"
show_docs_dir "database" "🗄️ 数据库文档" "${GREEN}"
show_docs_dir "planning" "📋 项目规划" "${GREEN}"
show_docs_dir "features" "✨ 功能特性" "${GREEN}"
show_docs_dir "api" "🔌 API 文档" "${GREEN}"
show_docs_dir "operations" "🔧 运维部署" "${GREEN}"

echo -e "${BLUE}🎯 快速导航${NC}"
echo -e "${CYAN}=============================================${NC}"
echo -e "🚀 新手入门: ${YELLOW}[PostgreSQL 快速启动](setup/POSTGRESQL_QUICKSTART.md)${NC}"
echo -e "💻 开发指南: ${YELLOW}[Claude 开发指南](development/CLAUDE.md)${NC}"
echo -e "🗄️ 数据库管理: ${YELLOW}[数据库连接指南](database/connection-guide.md)${NC}"
echo -e "📋 项目规划: ${YELLOW}[开发计划](planning/development-plan.md)${NC}"
echo

echo -e "${BLUE}📝 使用提示${NC}"
echo -e "${CYAN}=============================================${NC}"
echo -e "• 所有文档都支持相对路径链接"
echo -e "• 使用 './scripts/docs-index.sh' 查看此索引"
echo -e "• 文档结构说明: ${YELLOW}[STRUCTURE.md](STRUCTURE.md)${NC}"
echo

echo -e "${BLUE}🔄 更新时间${NC}"
echo -e "$(date '+%Y-%m-%d %H:%M:%S')"