#!/bin/bash

# PostgreSQL 开发环境设置脚本
echo "🚀 设置 PostgreSQL 开发环境..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}步骤 1: 检查 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装。请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装。${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已安装${NC}"

echo -e "${GREEN}步骤 2: 启动 PostgreSQL 和 Redis 服务...${NC}"
docker-compose up -d db redis

# 等待服务启动
echo -e "${YELLOW}⏳ 等待数据库服务启动...${NC}"
sleep 10

# 检查服务状态
echo -e "${GREEN}步骤 3: 检查服务状态...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ 数据库服务已启动${NC}"
else
    echo -e "${RED}❌ 数据库服务启动失败${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${GREEN}步骤 4: 检查 Node.js...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm 未安装。请先安装 Node.js: https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 已安装${NC}"

echo -e "${GREEN}步骤 5: 生成 Prisma 客户端...${NC}"
npm run db:generate

echo -e "${GREEN}步骤 6: 运行数据库迁移...${NC}"
npm run db:migrate

echo -e "${GREEN}步骤 7: 填充种子数据...${NC}"
npm run db:seed

echo -e "${GREEN}步骤 8: 验证数据库连接...${NC}"
npm run db:studio &
STUDIO_PID=$!

echo -e "${GREEN}🎉 PostgreSQL 开发环境设置完成！${NC}"
echo -e "${YELLOW}📝 接下来你可以：${NC}"
echo -e "  - 运行 'npm run dev' 启动开发服务器"
echo -e "  - 访问 'http://localhost:5555' 查看 Prisma Studio"
echo -e "  - 运行 'npm run db:studio' 重新打开数据库管理界面"

# 可选：询问是否启动开发服务器
read -p "是否现在启动开发服务器？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 启动开发服务器...${NC}"
    npm run dev
fi

# 清理
kill $STUDIO_PID 2>/dev/null