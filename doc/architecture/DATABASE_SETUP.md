# 数据库配置和管理文档

## 概述

本文档描述了个人博客项目的数据库配置、管理和维护流程。

## 技术栈

- **数据库**: PostgreSQL 14+
- **缓存**: Redis 7+
- **ORM**: Prisma 5+
- **备份策略**: 自动化备份脚本
- **监控**: 数据库性能监控脚本

## 数据库结构

### 核心模型

- **Users**: 用户管理和认证
- **Posts**: 文章内容管理
- **Categories**: 文章分类
- **Comments**: 评论系统
- **Likes**: 点赞功能
- **Views**: 浏览统计
- **Subscriptions**: 邮件订阅
- **Settings**: 网站设置

### 关系图

```
Users (1) → (N) Posts
Users (1) → (N) Comments
Users (1) → (N) Likes
Posts (1) → (N) Comments
Posts (1) → (N) Likes
Posts (1) → (N) Views
Posts (N) ↔ (N) Categories
```

## 环境配置

### 环境变量

```bash
# 数据库连接
DATABASE_URL="postgresql://postgres@localhost:5432/personal_blog"

# Redis缓存
REDIS_URL="redis://localhost:6379"

# NextAuth配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 数据库启动

#### 本地开发环境

```bash
# 启动PostgreSQL
pg_ctl -D /usr/local/var/postgres/personal-blog -l logfile start

# 启动Redis
redis-server --daemonize yes --port 6379

# 创建数据库
createdb personal_blog
```

#### Docker环境

```bash
# 启动数据库服务
docker-compose up -d db redis
```

## 数据库初始化

### 1. 运行迁移

```bash
# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init
```

### 2. 创建种子数据

```bash
# 基础种子数据
npm run db:seed

# 额外种子数据
npx tsx prisma/additional-seed.ts
```

## 数据库优化

### 索引策略

- **主键索引**: 所有表的主键
- **唯一索引**: email、username、slug等唯一字段
- **复合索引**: 常用查询组合 (published + featured, authorId + published)
- **全文搜索索引**: title、content字段
- **时间索引**: createdAt、publishedAt等时间字段

### 连接池配置

```typescript
// Prisma连接池配置
const prisma = new PrismaClient({
  log: ['query'],
  errorFormat: 'pretty',
})
```

### 缓存策略

- **文章缓存**: 30分钟 (cacheTTL.MEDIUM)
- **用户信息缓存**: 1小时 (cacheTTL.LONG)
- **评论缓存**: 5分钟 (cacheTTL.SHORT)
- **设置缓存**: 24小时 (cacheTTL.DAY)

## 数据库管理工具

### 备份脚本

**位置**: `/scripts/backup-database.sh`

**功能**:

- 自动创建完整数据库备份
- 创建schema-only备份
- 压缩备份文件
- 自动清理过期备份 (30天)
- 生成备份元数据
- 备份完整性验证

**使用方法**:

```bash
# 手动备份
./scripts/backup-database.sh

# 添加到crontab进行自动备份
0 2 * * * /path/to/scripts/backup-database.sh
```

### 恢复脚本

**位置**: `/scripts/restore-database.sh`

**功能**:

- 从备份文件恢复数据库
- 列出可用备份
- 创建恢复前备份
- 支持schema-only恢复
- 恢复验证

**使用方法**:

```bash
# 列出可用备份
./scripts/restore-database.sh --list

# 恢复数据库
./scripts/restore-database.sh blog_backup_20231109_120000.sql.gz

# 强制恢复（不询问确认）
./scripts/restore-database.sh --force blog_backup_20231109_120000.sql.gz

# 仅恢复schema
./scripts/restore-database.sh --schema-only blog_backup_20231109_120000.sql.gz
```

### 监控脚本

**位置**: `/scripts/database-monitor.sh`

**功能**:

- 数据库连接监控
- 性能指标检查
- 慢查询分析
- 索引使用情况
- 缓存命中率检查
- 磁盘空间监控
- 自动生成性能报告

**使用方法**:

```bash
# 完整监控检查
./scripts/database-monitor.sh

# 快速健康检查
./scripts/database-monitor.sh --quick

# 生成性能报告
./scripts/database-monitor.sh --report

# 仅健康检查
./scripts/database-monitor.sh --health-only
```

## 数据库维护

### 定期维护任务

#### 1. 自动VACUUM和ANALYZE

PostgreSQL已经配置了autovacuum，但可以手动运行：

```sql
-- 手动VACUUM
VACUUM ANALYZE;

-- 检查需要VACUUM的表
SELECT schemaname, tablename, n_dead_tup, n_live_tup,
       round((n_dead_tup::float / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) AS dead_pct
FROM pg_stat_user_tables;
```

#### 2. 清理过期数据

```sql
-- 清理过期session
SELECT cleanup_old_sessions();

-- 清理过期refresh tokens
SELECT cleanup_old_refresh_tokens();
```

#### 3. 更新统计信息

```sql
-- 更新表统计信息
ANALYZE;

-- 查看统计信息准确性
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

### 性能调优建议

#### 1. 连接数配置

```sql
-- 查看当前连接数
SHOW max_connections;

-- 查看当前活跃连接
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

#### 2. 内存配置

```sql
-- 查看shared_buffers
SHOW shared_buffers;

-- 查看effective_cache_size
SHOW effective_cache_size;
```

#### 3. 检查点配置

```sql
-- 查看检查点配置
SHOW checkpoint_completion_target;
SHOW wal_buffers;
```

## 数据完整性验证

### 验证脚本

**位置**: `/scripts/test-database.ts`

**功能**:

- 基本连接测试
- CRUD操作测试
- 关系完整性测试
- 约束验证测试
- 索引性能测试
- 缓存功能测试

**使用方法**:

```bash
# 运行完整测试套件
DATABASE_URL="postgresql://postgres@localhost:5432/personal_blog" \
REDIS_URL="redis://localhost:6379" \
npx tsx scripts/test-database.ts
```

### 快速验证

**位置**: `/scripts/final-verification.ts`

**功能**:

- 数据连接性检查
- 数据完整性验证
- 关系测试
- 性能测试
- 视图功能测试
- 约束验证

**使用方法**:

```bash
# 运行快速验证
DATABASE_URL="postgresql://postgres@localhost:5432/personal_blog" \
npx tsx scripts/final-verification.ts
```

## 监控和告警

### 关键指标

1. **连接使用率**: < 80%
2. **磁盘使用率**: < 85%
3. **缓存命中率**: > 90%
4. **慢查询**: 监控 > 1000ms的查询
5. **死锁检测**: 实时监控

### 告警策略

- **CRITICAL**: 数据库不可用、磁盘空间不足
- **WARNING**: 高连接使用率、慢查询、低缓存命中率
- **INFO**: 一般性能信息、维护通知

## 故障排除

### 常见问题

#### 1. 连接被拒绝

```bash
# 检查PostgreSQL是否运行
pg_isready -h localhost -p 5432

# 检查PostgreSQL状态
pg_ctl status -D /usr/local/var/postgres/personal-blog
```

#### 2. 权限问题

```sql
-- 检查用户权限
\du

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE personal_blog TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

#### 3. 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理日志
pg_ctl stop -D /usr/local/var/postgres/personal-blog
rm logfile
pg_ctl start -D /usr/local/var/postgres/personal-blog
```

## 安全配置

### 数据库安全

1. **使用强密码**: 更新默认密码
2. **限制连接**: 配置pg_hba.conf
3. **SSL连接**: 启用SSL/TLS
4. **定期备份**: 自动备份策略
5. **访问控制**: 最小权限原则

### 备份安全

1. **备份加密**: 使用gzip压缩
2. **存储安全**: 安全存储位置
3. **定期测试**: 恢复测试验证
4. **异地备份**: 多地存储策略

## 部署清单

### 生产环境部署

- [ ] 配置环境变量
- [ ] 启动数据库服务
- [ ] 运行数据库迁移
- [ ] 创建种子数据
- [ ] 配置连接池
- [ ] 设置缓存策略
- [ ] 配置备份脚本
- [ ] 设置监控告警
- [ ] 运行完整性验证
- [ ] 测试恢复流程

## 联系信息

如有问题或需要帮助，请联系数据库管理员。

---

**最后更新**: 2024-11-09
**版本**: 1.0.0
**维护者**: 数据库管理员
