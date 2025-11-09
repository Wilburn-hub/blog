# 个人博客部署指南

## 目录
- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [详细部署步骤](#详细部署步骤)
- [SSL证书配置](#ssl证书配置)
- [环境变量配置](#环境变量配置)
- [服务监控](#服务监控)
- [备份与恢复](#备份与恢复)
- [故障排除](#故障排除)

## 环境要求

### 系统要求
- 操作系统: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 内存: 最少 2GB RAM
- 存储: 最少 20GB 可用空间
- 网络: 稳定的互联网连接

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- Node.js 18+ (仅开发环境需要)
- PostgreSQL 15+ (如果不使用Docker)
- Redis 7+ (如果不使用Docker)

## 快速部署

### 一键部署命令
```bash
# 克隆项目
git clone https://github.com/your-username/personal-blog.git
cd personal-blog

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量 (必须)
nano .env

# 执行一键部署
./scripts/deployment/deploy.sh
```

### 验证部署
```bash
# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f

# 健康检查
curl http://localhost:3000/api/health
```

## 详细部署步骤

### 1. 服务器准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git htop

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到docker组
sudo usermod -aG docker $USER

# 重新登录以使权限生效
```

### 2. 项目部署

```bash
# 创建应用目录
sudo mkdir -p /opt/personal-blog
sudo chown $USER:$USER /opt/personal-blog
cd /opt/personal-blog

# 克隆项目代码
git clone https://github.com/your-username/personal-blog.git .

# 配置环境变量
cp .env.example .env
nano .env
```

### 3. 环境变量配置

编辑 `.env` 文件，配置以下关键参数：

```bash
# 数据库配置
POSTGRES_PASSWORD=your_secure_password_here

# NextAuth配置
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_minimum_32_characters_long

# Redis配置
REDIS_PASSWORD=your_redis_password_here

# 邮件配置 (可选)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. 启动服务

```bash
# 创建必要的目录
mkdir -p logs/nginx backups nginx/ssl

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
sleep 30

# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 检查服务状态
docker-compose ps
```

## SSL证书配置

### 自动配置SSL (推荐)

```bash
# 1. 确保域名已解析到服务器
nslookup yourdomain.com

# 2. 修改nginx配置中的域名
nano nginx/conf.d/default.conf
# 将 yourdomain.com 替换为实际域名

# 3. 启动服务 (包含Certbot)
docker-compose -f docker-compose.ssl.yml up -d

# 4. 获取SSL证书
docker-compose exec certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# 5. 重启Nginx以加载SSL证书
docker-compose restart nginx
```

### 手动配置SSL

1. 获取SSL证书文件 (fullchain.pem 和 privkey.pem)
2. 将证书文件放置在 `nginx/ssl/` 目录
3. 修改 `nginx/conf.d/default.conf` 中的域名配置
4. 重启Nginx服务

## 环境变量配置详解

### 必需配置
- `POSTGRES_PASSWORD`: PostgreSQL数据库密码
- `NEXTAUTH_URL`: 应用访问URL
- `NEXTAUTH_SECRET`: NextAuth会话密钥 (最少32字符)
- `REDIS_PASSWORD`: Redis密码

### 可选配置
- `SMTP_HOST`: 邮件服务器地址
- `SMTP_USER`: 邮件服务器用户名
- `SMTP_PASS`: 邮件服务器密码
- `GOOGLE_CLIENT_ID`: Google OAuth客户端ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth密钥

### 安全配置
- 使用强密码 (最少16字符，包含大小写字母、数字、特殊字符)
- 定期轮换密钥和密码
- 不要在代码中提交敏感信息

## 服务监控

### 健康检查端点
- 应用健康检查: `GET /api/health`
- 数据库检查: `GET /api/health/db`
- Redis检查: `GET /api/health/redis`

### 监控脚本使用

```bash
# 一次性检查
./scripts/deployment/monitor.sh --once

# 持续监控
./scripts/deployment/monitor.sh --continuous

# 生成监控报告
./scripts/deployment/monitor.sh --report
```

### 日志管理

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f db
docker-compose logs -f nginx

# 查看最近的日志
docker-compose logs --tail=100 app

# 清理日志
sudo journalctl --vacuum-time=7d
```

### 系统资源监控

```bash
# 查看系统负载
htop

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看Docker资源使用
docker stats
```

## 备份与恢复

### 自动备份

备份服务已配置在docker-compose中，每天凌晨2点自动执行备份。

### 手动备份

```bash
# 完整备份 (数据库 + 文件)
./scripts/deployment/backup.sh

# 仅备份数据库
./scripts/deployment/backup.sh --db-only

# 仅备份文件
./scripts/deployment/backup.sh --files-only

# 列出可用备份
./scripts/deployment/backup.sh --list
```

### 数据恢复

```bash
# 交互式恢复
./scripts/deployment/restore.sh

# 恢复指定备份
./scripts/deployment/restore.sh /path/to/backup.sql.gz

# 列出可用备份
./scripts/deployment/restore.sh --list

# 不创建恢复前备份
./scripts/deployment/restore.sh --no-pre-backup backup.sql.gz
```

### 备份策略

- **数据库备份**: 每日自动备份，保留30天
- **文件备份**: 每周自动备份，保留4周
- **配置备份**: 手动执行，保留1年
- **远程同步**: 可选，同步到云存储

## 故障排除

### 常见问题

#### 1. 服务无法启动

**症状**: `docker-compose ps` 显示服务状态为 `Exit` 或 `Restarting`

**解决方案**:
```bash
# 查看详细错误日志
docker-compose logs app

# 检查环境变量配置
docker-compose config

# 重新构建镜像
docker-compose build --no-cache

# 重启服务
docker-compose restart
```

#### 2. 数据库连接失败

**症状**: 应用日志显示数据库连接错误

**解决方案**:
```bash
# 检查数据库服务状态
docker-compose ps db

# 检查数据库健康状态
docker-compose exec db pg_isready -U postgres

# 检查网络连接
docker-compose exec app ping db

# 重置数据库密码 (如需要)
docker-compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"
```

#### 3. Redis连接失败

**症状**: 缓存功能失效，显示Redis连接错误

**解决方案**:
```bash
# 检查Redis服务状态
docker-compose ps redis

# 测试Redis连接
docker-compose exec redis redis-cli ping

# 检查Redis密码
docker-compose exec redis redis-cli -a your_password ping

# 重启Redis服务
docker-compose restart redis
```

#### 4. SSL证书问题

**症状**: 浏览器显示证书错误

**解决方案**:
```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# 重新获取证书
docker-compose exec certbot certonly --webroot --webroot-path=/var/www/certbot -d yourdomain.com

# 重启Nginx
docker-compose restart nginx

# 检查Nginx配置
docker-compose exec nginx nginx -t
```

#### 5. 磁盘空间不足

**症状**: 服务无法启动或运行缓慢

**解决方案**:
```bash
# 检查磁盘使用情况
df -h

# 清理Docker资源
docker system prune -a

# 清理旧备份
find backups/ -name "*.gz" -mtime +30 -delete

# 清理日志文件
sudo journalctl --vacuum-time=7d
docker-compose logs --tail=0 -f > /dev/null
```

#### 6. 内存使用过高

**症状**: 系统响应缓慢，OOM错误

**解决方案**:
```bash
# 检查内存使用
free -h
docker stats

# 调整容器内存限制
# 编辑 docker-compose.yml 添加 mem_limit 配置

# 重启服务释放内存
docker-compose restart
```

### 性能优化

#### 数据库优化
```sql
-- 检查数据库性能
SELECT * FROM pg_stat_activity;

-- 查看慢查询
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 更新表统计信息
ANALYZE;

-- 重建索引
REINDEX DATABASE personal_blog;
```

#### Nginx优化
```bash
# 启用Gzip压缩 (已在配置中启用)
# 配置缓存 (已在配置中启用)
# 启用HTTP/2 (已在配置中启用)

# 检查Nginx状态
curl http://localhost/nginx_status

# 重新加载配置
docker-compose exec nginx nginx -s reload
```

#### 应用优化
```bash
# 检查应用性能
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000

# 启用Node.js性能监控
# 编辑 package.json 添加 --inspect 标志

# 查看应用内存使用
docker-compose exec app node -e "console.log(process.memoryUsage())"
```

### 紧急恢复流程

#### 完全系统恢复
```bash
# 1. 停止所有服务
docker-compose down

# 2. 备份当前数据 (如果可能)
./scripts/deployment/backup.sh

# 3. 从最新备份恢复
./scripts/deployment/restore.sh

# 4. 重新启动服务
docker-compose up -d

# 5. 验证服务状态
./scripts/deployment/monitor.sh --once
```

#### 数据库恢复
```bash
# 1. 停止应用服务
docker-compose stop app

# 2. 恢复数据库
./scripts/deployment/restore.sh --no-pre-backup backup_file.sql.gz

# 3. 运行迁移
docker-compose run --rm app npx prisma migrate deploy

# 4. 重启应用
docker-compose start app
```

## 维护建议

### 定期维护任务

1. **每日**
   - 检查服务状态
   - 查看错误日志
   - 监控系统资源

2. **每周**
   - 更新系统包
   - 检查备份完整性
   - 清理临时文件

3. **每月**
   - 更新应用依赖
   - 安全扫描
   - 性能评估

4. **每季度**
   - 全面系统更新
   - 安全审计
   - 灾难恢复演练

### 监控告警

建议配置以下监控告警：
- 服务不可用
- 磁盘空间不足 (< 10%)
- 内存使用过高 (> 90%)
- SSL证书即将过期 (< 30天)
- 备份失败

### 安全最佳实践

1. 定期更新密码和密钥
2. 启用防火墙
3. 限制SSH访问
4. 定期安全扫描
5. 监控异常访问
6. 及时应用安全补丁

## 联系支持

如果遇到无法解决的问题，请：

1. 查看本文档的故障排除部分
2. 检查项目GitHub Issues
3. 收集相关日志文件
4. 联系技术支持团队

---

**注意**: 在生产环境中进行任何操作前，请务必备份数据！