# PostgreSQL 开发环境设置指南

## 🚀 快速开始

你的项目已经配置好了 PostgreSQL 开发环境！按照以下步骤启动：

### 步骤 1: 安装必需工具

```bash
# 安装 Homebrew (如果没有)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node

# 安装 Docker Desktop
brew install --cask docker
```

### 步骤 2: 一键设置 PostgreSQL 环境

```bash
# 运行自动设置脚本
./scripts/setup-postgresql-dev.sh
```

这个脚本会自动完成：

- ✅ 检查 Docker 环境
- ✅ 启动 PostgreSQL 和 Redis 服务
- ✅ 生成 Prisma 客户端
- ✅ 运行数据库迁移
- ✅ 填充种子数据
- ✅ 验证数据库连接

### 步骤 3: 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看你的博客！

## 🛠️ 手动设置步骤

如果自动脚本无法运行，可以手动执行以下步骤：

### 1. 启动数据库服务

```bash
npm run docker:dev
```

### 2. 生成 Prisma 客户端

```bash
npm run db:generate
```

### 3. 运行数据库迁移

```bash
npm run db:migrate
```

### 4. 填充种子数据

```bash
npm run db:seed
```

### 5. 验证连接

```bash
npm run db:studio
```

## 🔧 数据库管理

### 查看数据库状态

```bash
./scripts/check-database.sh
```

### 切换数据库类型

```bash
# 切换到 PostgreSQL
./scripts/switch-database.sh postgresql

# 切换回 SQLite
./scripts/switch-database.sh sqlite
```

### 重置数据库

```bash
# 停止服务
npm run docker:down

# 重新启动
npm run docker:dev

# 重新迁移
npm run db:migrate
npm run db:seed
```

## 📊 数据库连接信息

- **主机**: localhost
- **端口**: 5432
- **数据库**: personal_blog_dev
- **用户名**: postgres
- **密码**: password

连接字符串: `postgresql://postgres:password@localhost:5432/personal_blog_dev`

## 🗄️ 数据库管理工具

### Prisma Studio (推荐)

```bash
npm run db:studio
```

访问 http://localhost:5555 进行可视化管理

### 命令行连接

```bash
# 连接到 PostgreSQL 容器
docker exec -it personal-blog-db-1 psql -U postgres -d personal_blog_dev

# 或者使用本地 psql 客户端
psql postgresql://postgres:password@localhost:5432/personal_blog_dev
```

## 🔍 故障排除

### Docker 服务无法启动

```bash
# 检查 Docker 状态
docker --version
docker ps

# 重启 Docker Desktop
# 或者重新安装 Docker Desktop
```

### 数据库连接失败

```bash
# 检查环境变量
cat .env

# 重新生成 Prisma 客户端
npm run db:generate

# 检查容器状态
docker-compose ps
docker-compose logs db
```

### 迁移失败

```bash
# 重置数据库
npm run docker:down
docker volume rm personal-blog_postgres_data  # 注意：这会删除所有数据
npm run docker:dev
npm run db:migrate
```

## 📝 环境变量说明

当前 PostgreSQL 配置 (`.env` 文件):

```bash
# 数据库配置
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_blog_dev"
POSTGRES_DB=personal_blog_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Redis 配置
REDIS_URL="redis://localhost:6379"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="blog-secret-key-2024-11-09-very-secure-random-string-for-development"
```

## 🔄 切换回 SQLite

如果需要切换回 SQLite 开发环境：

```bash
./scripts/switch-database.sh sqlite
npm run db:generate
npm run db:push
npm run db:seed
```

## 🚨 重要提示

1. **数据持久化**: PostgreSQL 数据存储在 Docker volume 中，重启容器不会丢失数据
2. **端口冲突**: 确保 5432 端口没有被其他应用占用
3. **内存使用**: PostgreSQL 会消耗更多内存，但提供更好的性能和功能
4. **生产环境**: PostgreSQL 配置更接近生产环境，避免部署时的意外

## 📚 更多资源

- [Prisma 文档](https://www.prisma.io/docs)
- [Docker 文档](https://docs.docker.com)
- [PostgreSQL 文档](https://www.postgresql.org/docs)
- [Next.js 文档](https://nextjs.org/docs)
