#!/bin/bash

# PostgreSQL 开发环境启动脚本
# 使用 NVM 中的 Node.js

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 启动 PostgreSQL 开发环境...${NC}"

# Node.js 路径
NODE_PATH="/Users/liuweijia/.nvm/versions/node/v20.19.0/bin"
NPM_PATH="$NODE_PATH/npm"
export PATH="$NODE_PATH:$PATH"

echo -e "${GREEN}✅ 使用 Node.js 版本: $("$NODE_PATH/node" --version)${NC}"
echo -e "${GREEN}✅ 使用 npm 版本: $("$NPM_PATH" --version)${NC}"

# 检查 Docker 服务
echo -e "${YELLOW}🐳 检查 Docker 服务...${NC}"
if ! /usr/local/bin/docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker 未运行，请启动 Docker Desktop${NC}"
    exit 1
fi

# 检查 PostgreSQL 容器
echo -e "${YELLOW}🗄️  检查 PostgreSQL 容器...${NC}"
if ! /usr/local/bin/docker ps | grep -q "personal-postgres"; then
    echo -e "${YELLOW}🔄 启动 PostgreSQL 容器...${NC}"
    /usr/local/bin/docker run -d --name personal-postgres \
        -e POSTGRES_PASSWORD=password \
        -e POSTGRES_DB=personal_blog_dev \
        -p 5432:5432 \
        postgres:15-alpine
    echo -e "${GREEN}✅ PostgreSQL 容器已启动${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL 容器已在运行${NC}"
fi

# 检查 Redis 容器
echo -e "${YELLOW}📦 检查 Redis 容器...${NC}"
if ! /usr/local/bin/docker ps | grep -q "personal-redis"; then
    echo -e "${YELLOW}🔄 启动 Redis 容器...${NC}"
    /usr/local/bin/docker run -d --name personal-redis \
        -p 6379:6379 \
        redis:7-alpine || echo -e "${YELLOW}⚠️  Redis 端口可能被占用，跳过${NC}"
else
    echo -e "${GREEN}✅ Redis 容器已在运行${NC}"
fi

# 等待数据库启动
echo -e "${YELLOW}⏳ 等待数据库启动...${NC}"
sleep 5

# 生成 Prisma 客户端
echo -e "${YELLOW}🔧 生成 Prisma 客户端...${NC}"
"$NPM_PATH" run db:generate

# 验证数据库连接
echo -e "${YELLOW}🔗 验证数据库连接...${NC}"
if "$NPM_PATH" run db:studio --browser none > /dev/null 2>&1 & then
    sleep 2
    if kill %1 2>/dev/null; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
    fi
fi

echo -e "${GREEN}🎉 PostgreSQL 开发环境启动完成！${NC}"
echo -e "${BLUE}📝 可用命令:${NC}"
echo -e "  - 启动开发服务器: ${YELLOW}npm run dev${NC}"
echo -e "  - 打开数据库管理: ${YELLOW}npm run db:studio${NC}"
echo -e "  - 重新生成客户端: ${YELLOW}npm run db:generate${NC}"
echo -e "  - 查看数据库状态: ${YELLOW}./scripts/check-database.sh${NC}"

echo -e "${BLUE}🌐 访问地址:${NC}"
echo -e "  - 应用: ${YELLOW}http://localhost:3000${NC}"
echo -e "  - 数据库管理: ${YELLOW}http://localhost:5555${NC}"

# 询问是否启动开发服务器
echo
read -p "是否现在启动开发服务器？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 启动开发服务器...${NC}"
    "$NPM_PATH" run dev
fi