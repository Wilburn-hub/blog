# PostgreSQL 本地连接快速启动指南

## 🎯 当前状态

✅ **PostgreSQL 开发环境已成功配置并运行！**

## 🚀 快速启动

### 方法一：使用自动化脚本（推荐）

```bash
./scripts/start-postgresql-dev.sh
```

### 方法二：手动启动

```bash
# 1. 设置 Node.js 路径
export PATH="/Users/liuweijia/.nvm/versions/node/v20.19.0/bin:$PATH"

# 2. 启动开发服务器
npm run dev
```

## 📊 服务状态

当前运行的服务：

- **PostgreSQL**: `localhost:5432` (容器: personal-postgres)
- **Redis**: `localhost:6379` (如果端口可用)
- **Node.js**: v20.19.0 (通过 NVM)
- **数据库**: personal_blog_dev

## 🔗 连接信息

### 数据库连接

- **主机**: localhost
- **端口**: 5432
- **数据库**: personal_blog_dev
- **用户名**: postgres
- **密码**: password
- **连接字符串**: `postgresql://postgres:password@localhost:5432/personal_blog_dev`

### Web 访问

- **应用**: http://localhost:3000
- **数据库管理**: http://localhost:5555 (Prisma Studio)

## 🛠️ 常用命令

```bash
# 设置环境（每次新终端都需要）
export PATH="/Users/liuweijia/.nvm/versions/node/v20.19.0/bin:$PATH"

# 开发服务器
npm run dev

# 数据库管理
npm run db:studio

# 重新生成 Prisma 客户端
npm run db:generate

# 重置数据库
npx prisma db push --force-reset && npm run db:seed

# 检查服务状态
./scripts/check-database.sh

# 切换数据库类型
./scripts/switch-database.sh postgresql  # 切换到 PostgreSQL
./scripts/switch-database.sh sqlite      # 切换到 SQLite
```

## 📁 数据库内容

已初始化的数据：

- ✅ 管理员用户: `admin@example.com` (密码: `admin123`)
- ✅ 默认文章分类
- ✅ 示例博客文章
- ✅ 系统设置配置

## 🔍 故障排除

### Node.js 未找到

```bash
export PATH="/Users/liuweijia/.nvm/versions/node/v20.19.0/bin:$PATH"
```

### Docker 容器问题

```bash
# 查看容器状态
docker ps -a

# 重启容器
docker start personal-postgres

# 重新创建容器
docker rm personal-postgres
docker run -d --name personal-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=personal_blog_dev \
  -p 5432:5432 \
  postgres:15-alpine
```

### 数据库连接失败

```bash
# 检查环境变量
cat .env

# 重新生成客户端
npm run db:generate

# 强制重置数据库
npx prisma db push --force-reset
npm run db:seed
```

## 📝 环境配置

当前 `.env` 配置：

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_blog_dev"
POSTGRES_DB=personal_blog_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
REDIS_URL="redis://localhost:6379"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="blog-secret-key-2024-11-09-very-secure-random-string-for-development"
```

## 🎉 开始使用

现在你可以：

1. **启动应用**: `./scripts/start-postgresql-dev.sh`
2. **访问网站**: http://localhost:3000
3. **管理数据库**: http://localhost:5555
4. **开始开发**: 编辑项目文件

## 💡 提示

- 每次打开新终端时，需要设置 Node.js 路径
- PostgreSQL 数据在 Docker 容器中，重启容器不会丢失数据
- 使用 `./scripts/check-database.sh` 检查所有服务状态
- 可以随时使用 `./scripts/switch-database.sh sqlite` 切换回 SQLite
