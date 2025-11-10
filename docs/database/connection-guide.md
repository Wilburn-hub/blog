# 数据库连接指南

本指南详细说明如何连接到项目的数据库。

## 🔗 连接信息

### 开发环境 (PostgreSQL)

```bash
# 基本信息
主机: localhost
端口: 5432
数据库: personal_blog_dev
用户名: postgres
密码: password

# 连接字符串
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_blog_dev"
```

### 容器信息

```bash
# Docker 容器
容器名称: personal-postgres
镜像: postgres:15-alpine
端口映射: 5432:5432
```

## 🛠️ 连接方式

### 1. Prisma Studio (推荐)

```bash
npm run db:studio
```

访问: http://localhost:5555

### 2. psql 命令行

```bash
# 直接连接
psql postgresql://postgres:password@localhost:5432/personal_blog_dev

# 或通过 Docker 容器
docker exec -it personal-postgres psql -U postgres -d personal_blog_dev
```

### 3. GUI 工具

支持任何 PostgreSQL 客户端工具：

- **TablePlus**
- **DBeaver**
- **pgAdmin**
- **DataGrip**

连接参数同上。

## 🔄 数据库切换

### 切换到 PostgreSQL

```bash
./scripts/switch-database.sh postgresql
```

### 切换到 SQLite

```bash
./scripts/switch-database.sh sqlite
```

## 🔧 环境配置

### PostgreSQL 配置 (.env)

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_blog_dev"
POSTGRES_DB=personal_blog_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
REDIS_URL="redis://localhost:6379"
```

### SQLite 配置

```bash
DATABASE_URL="file:./prisma/dev.db"
```

## 🚨 故障排除

### 连接失败

```bash
# 检查容器状态
docker ps | grep personal-postgres

# 重启容器
docker restart personal-postgres

# 检查端口占用
lsof -i :5432
```

### 权限问题

```bash
# 重建容器
docker rm personal-postgres
docker run -d --name personal-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=personal_blog_dev \
  -p 5432:5432 \
  postgres:15-alpine
```

### 环境变量问题

```bash
# 检查当前配置
cat .env | grep DATABASE_URL

# 重新加载环境
npm run db:generate
```

## 📊 数据备份

### 导出数据

```bash
# 通过 Docker
docker exec personal-postgres pg_dump -U postgres personal_blog_dev > backup.sql

# 本地 psql
pg_dump postgresql://postgres:password@localhost:5432/personal_blog_dev > backup.sql
```

### 导入数据

```bash
# 通过 Docker
docker exec -i personal-postgres psql -U postgres personal_blog_dev < backup.sql

# 本地 psql
psql postgresql://postgres:password@localhost:5432/personal_blog_dev < backup.sql
```

## 🔍 监控和日志

### 查看容器日志

```bash
docker logs personal-postgres
```

### 实时监控

```bash
docker logs -f personal-postgres
```

### 连接测试

```bash
# 测试连接
npm run db:generate

# 如果成功，会显示: "✔ Generated Prisma Client"
```

## 📚 相关资源

- [Prisma 文档](https://www.prisma.io/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Docker PostgreSQL 镜像](https://hub.docker.com/_/postgres)
