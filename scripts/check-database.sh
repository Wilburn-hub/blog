#!/bin/bash

# 数据库状态检查脚本

echo "🔍 检查数据库状态..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查环境变量
echo -e "${YELLOW}📋 环境变量检查:${NC}"
if [ -f .env ]; then
    echo "✅ .env 文件存在"
    if grep -q "postgresql" .env; then
        echo "🗄️  当前配置: PostgreSQL"
        DB_TYPE="postgresql"
    elif grep -q "sqlite" .env; then
        echo "🗄️  当前配置: SQLite"
        DB_TYPE="sqlite"
    else
        echo -e "${RED}❌ 无法确定数据库类型${NC}"
    fi
else
    echo -e "${RED}❌ .env 文件不存在${NC}"
fi

# 检查 Docker 服务
echo -e "\n${YELLOW}🐳 Docker 服务检查:${NC}"
if command -v docker &> /dev/null; then
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "personal-blog"; then
        echo -e "${GREEN}✅ 数据库容器正在运行${NC}"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep personal-blog
    else
        echo -e "${YELLOW}⚠️  数据库容器未运行${NC}"
    fi
else
    echo -e "${RED}❌ Docker 未安装或未运行${NC}"
fi

# 检查 Node.js
echo -e "\n${YELLOW}📦 Node.js 检查:${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js 未安装${NC}"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm 未安装${NC}"
fi

# 检查 Prisma 客户端
echo -e "\n${YELLOW}🔧 Prisma 检查:${NC}"
if [ -d "node_modules/.prisma" ]; then
    echo -e "${GREEN}✅ Prisma 客户端已生成${NC}"
else
    echo -e "${YELLOW}⚠️  Prisma 客户端未生成，运行 'npm run db:generate'${NC}"
fi

# 检查数据库文件 (SQLite)
if [ "$DB_TYPE" = "sqlite" ]; then
    echo -e "\n${YELLOW}📁 SQLite 数据库检查:${NC}"
    if [ -f "prisma/dev.db" ]; then
        SIZE=$(du -h prisma/dev.db | cut -f1)
        echo -e "${GREEN}✅ SQLite 数据库存在 (大小: $SIZE)${NC}"
    else
        echo -e "${YELLOW}⚠️  SQLite 数据库文件不存在${NC}"
    fi
fi

# 数据库连接测试
echo -e "\n${YELLOW}🔗 连接测试:${NC}"
if command -v npm &> /dev/null; then
    echo "测试数据库连接..."
    if npm run db:generate --silent 2>/dev/null; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
    fi
fi

echo -e "\n${GREEN}🎯 建议的下一步操作:${NC}"
if [ "$DB_TYPE" = "postgresql" ]; then
    echo "  1. 确保 Docker 服务运行: npm run docker:dev"
    echo "  2. 生成 Prisma 客户端: npm run db:generate"
    echo "  3. 运行数据库迁移: npm run db:migrate"
    echo "  4. 填充种子数据: npm run db:seed"
    echo "  5. 启动开发服务器: npm run dev"
else
    echo "  1. 生成 Prisma 客户端: npm run db:generate"
    echo "  2. 推送数据库模式: npm run db:push"
    echo "  3. 填充种子数据: npm run db:seed"
    echo "  4. 启动开发服务器: npm run dev"
fi