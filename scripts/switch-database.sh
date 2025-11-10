#!/bin/bash

# 数据库切换脚本
# 用法: ./scripts/switch-database.sh [sqlite|postgresql]

set -e

TARGET_DB=${1:-sqlite}

echo "🔄 切换数据库到: $TARGET_DB"

# 备份当前配置
cp .env .env.backup-$(date +%Y%m%d-%H%M%S)

case $TARGET_DB in
    "postgresql"|"postgres")
        echo "切换到 PostgreSQL..."
        cp .env.postgresql-dev .env

        # 更新 Prisma schema
        sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
        sed -i '' 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' prisma/schema.prisma

        echo "✅ 已切换到 PostgreSQL 配置"
        echo "📝 下一步："
        echo "  1. 运行 'npm run docker:dev' 启动 PostgreSQL 服务"
        echo "  2. 运行 'npm run db:generate' 生成客户端"
        echo "  3. 运行 'npm run db:migrate' 迁移数据库"
        echo "  4. 运行 'npm run db:seed' 填充种子数据"
        ;;

    "sqlite")
        echo "切换到 SQLite..."

        # 恢复 SQLite 配置
        cat > .env << EOF
# Database (SQLite for development)
DATABASE_URL="file:./prisma/dev.db"

# Redis (optional - disabled for development)
# REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="blog-secret-key-2024-11-09-very-secure-random-string-for-development"

# Development
NODE_ENV="development"
EOF

        # 更新 Prisma schema
        sed -i '' 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
        sed -i '' 's|url      = env("DATABASE_URL")|url      = "file:./dev.db"|' prisma/schema.prisma

        echo "✅ 已切换到 SQLite 配置"
        echo "📝 下一步："
        echo "  1. 运行 'npm run db:generate' 生成客户端"
        echo "  2. 运行 'npm run db:push' 推送模式"
        echo "  3. 运行 'npm run db:seed' 填充种子数据"
        ;;

    *)
        echo "❌ 不支持的数据库类型: $TARGET_DB"
        echo "支持的类型: sqlite, postgresql"
        exit 1
        ;;
esac

echo "✅ 数据库配置切换完成！"