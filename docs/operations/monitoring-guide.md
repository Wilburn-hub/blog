# 系统监控指南

## 目录
- [监控架构](#监控架构)
- [监控指标](#监控指标)
- [监控工具](#监控工具)
- [告警配置](#告警配置)
- [性能调优](#性能调优)
- [日志管理](#日志管理)
- [故障排查](#故障排查)

## 监控架构

### 监控层级
```
┌─────────────────────────────────────────────────────────────┐
│                    用户监控层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Uptime    │  │  Pingdom    │  │  GTmetrix   │        │
│  │   Robot     │  │  Monitor    │  │   Pagespeed │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    应用监控层                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Health    │  │   Metrics   │  │   Tracing   │        │
│  │   Checks    │  │  Collection │  │   System    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    基础设施监控层                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     CPU     │  │   Memory    │  │    Disk     │        │
│  │   Monitor   │  │   Monitor   │  │   Monitor   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 数据流向
```
Application → Metrics Collector → Time Series Database → Alerting → Dashboard
     ↓               ↓                    ↓              ↓          ↓
   Logs → Log Aggregator → Log Storage → Analysis → Visualization
```

## 监控指标

### 应用层指标

#### 基础指标
- **响应时间** (Response Time)
  - 平均响应时间
  - 95th百分位响应时间
  - 99th百分位响应时间
  - 目标: < 200ms (平均), < 500ms (95th)

- **吞吐量** (Throughput)
  - 每秒请求数 (RPS)
  - 每分钟活跃用户数
  - 目标: > 100 RPS

- **错误率** (Error Rate)
  - HTTP错误率 (4xx, 5xx)
  - 应用错误率
  - 目标: < 1%

- **可用性** (Availability)
  - 服务可用性百分比
  - 健康检查通过率
  - 目标: > 99.9%

#### 业务指标
- 页面浏览量
- 用户注册数
- 文章发布数
- 评论数量

### 系统层指标

#### CPU指标
```bash
# 查看CPU使用率
top
htop
mpstat 1

# 监控指标
- CPU使用率 (%)
- CPU等待时间 (%)
- 上下文切换次数
- 运行队列长度
```

#### 内存指标
```bash
# 查看内存使用
free -h
vmstat 1

# 监控指标
- 内存使用率 (%)
- 可用内存 (GB)
- 交换分区使用率 (%)
- 缓存命中率 (%)
```

#### 磁盘指标
```bash
# 查看磁盘使用
df -h
iostat 1

# 监控指标
- 磁盘使用率 (%)
- 磁盘IOPS
- 磁盘吞吐量 (MB/s)
- I/O等待时间 (%)
```

#### 网络指标
```bash
# 查看网络状态
iftop
netstat -i
ss -s

# 监控指标
- 网络带宽使用率
- 连接数
- 网络延迟 (ms)
- 丢包率 (%)
```

### 数据库指标

#### PostgreSQL指标
```sql
-- 连接数监控
SELECT count(*) FROM pg_stat_activity;

-- 慢查询监控
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 数据库大小
SELECT pg_size_pretty(pg_database_size('personal_blog'));

-- 表大小
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public';
```

#### Redis指标
```bash
# Redis信息
redis-cli info

# 关键指标
- 内存使用情况
- 键空间统计
- 命令执行统计
- 连接数
- 命中率
```

## 监控工具

### 内置监控脚本

#### 应用监控脚本
```bash
#!/bin/bash
# scripts/monitoring/app-monitor.sh

# 检查应用健康状态
check_app_health() {
    local url="http://localhost:3000/api/health"
    local response=$(curl -s -w "%{http_code}" "$url")
    local http_code="${response: -3}"
    local body="${response%???}"

    if [[ "$http_code" == "200" ]]; then
        echo "✅ 应用健康检查通过"
        return 0
    else
        echo "❌ 应用健康检查失败 (HTTP $http_code)"
        return 1
    fi
}

# 检查响应时间
check_response_time() {
    local url="http://localhost:3000"
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")

    if (( $(echo "$response_time < 0.5" | bc -l) )); then
        echo "✅ 响应时间正常: ${response_time}s"
        return 0
    else
        echo "⚠️  响应时间较慢: ${response_time}s"
        return 1
    fi
}

# 检查错误率
check_error_rate() {
    local log_file="/app/logs/app.log"
    local recent_errors=$(tail -n 100 "$log_file" | grep -c "ERROR")

    if [[ $recent_errors -lt 5 ]]; then
        echo "✅ 错误率正常: $recent_errors/100"
        return 0
    else
        echo "⚠️  错误率较高: $recent_errors/100"
        return 1
    fi
}

# 主监控函数
main() {
    echo "=== 应用监控检查 $(date) ==="

    local failed_checks=0

    check_app_health || failed_checks=$((failed_checks + 1))
    check_response_time || failed_checks=$((failed_checks + 1))
    check_error_rate || failed_checks=$((failed_checks + 1))

    if [[ $failed_checks -eq 0 ]]; then
        echo "✅ 所有检查通过"
        return 0
    else
        echo "❌ $failed_checks 项检查失败"
        return 1
    fi
}

main "$@"
```

#### 数据库监控脚本
```bash
#!/bin/bash
# scripts/monitoring/db-monitor.sh

# PostgreSQL监控
check_postgres() {
    local container_name="personal-blog_db_1"

    # 检查连接
    if docker exec "$container_name" pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL连接正常"
    else
        echo "❌ PostgreSQL连接失败"
        return 1
    fi

    # 检查连接数
    local connections=$(docker exec "$container_name" psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;")
    if [[ $connections -lt 100 ]]; then
        echo "✅ 连接数正常: $connections"
    else
        echo "⚠️  连接数较高: $connections"
    fi

    # 检查数据库大小
    local db_size=$(docker exec "$container_name" psql -U postgres -t -c "SELECT pg_size_pretty(pg_database_size('personal_blog'));")
    echo "📊 数据库大小: $db_size"
}

# Redis监控
check_redis() {
    local container_name="personal-blog_redis_1"

    # 检查连接
    if docker exec "$container_name" redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis连接正常"
    else
        echo "❌ Redis连接失败"
        return 1
    fi

    # 检查内存使用
    local memory=$(docker exec "$container_name" redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    echo "📊 Redis内存使用: $memory"

    # 检查键数量
    local keys=$(docker exec "$container_name" redis-cli dbsize)
    echo "🔑 Redis键数量: $keys"
}

main() {
    echo "=== 数据库监控检查 $(date) ==="

    check_postgres
    check_redis
}

main "$@"
```

### 外部监控工具

#### Prometheus + Grafana (推荐)
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
```

#### Uptime Robot (免费)
- 监控网站可用性
- HTTP状态码检查
- 响应时间监控
- 告警通知

#### Google Analytics
- 用户行为分析
- 页面性能监控
- 流量来源分析
- 实时用户监控

## 告警配置

### 告警规则

#### 系统告警规则
```yaml
# monitoring/alerts.yml
groups:
  - name: system
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU使用率过高"
          description: "实例 {{ $labels.instance }} CPU使用率 {{ $value }}%"

      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "内存使用率过高"
          description: "实例 {{ $labels.instance }} 内存使用率 {{ $value }}%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "磁盘空间不足"
          description: "实例 {{ $labels.instance }} 磁盘空间剩余 {{ $value }}%"
```

#### 应用告警规则
```yaml
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "应用错误率过高"
          description: "错误率 {{ $value }}%"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "响应时间过长"
          description: "95th百分位响应时间 {{ $value }}s"

      - alert: ServiceDown
        expr: up{job="personal-blog"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "服务不可用"
          description: "服务 {{ $labels.instance }} 已停止运行"
```

### 通知渠道

#### Slack通知
```bash
# 发送Slack通知
send_slack_alert() {
    local message="$1"
    local webhook_url="${SLACK_WEBHOOK_URL}"

    curl -X POST "$webhook_url" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"$message\"}"
}
```

#### 邮件通知
```bash
# 发送邮件通知
send_email_alert() {
    local subject="$1"
    local message="$2"
    local recipient="${ADMIN_EMAIL}"

    echo "$message" | mail -s "$subject" "$recipient"
}
```

#### 短信通知 (可选)
```bash
# 发送短信通知 (需要短信服务API)
send_sms_alert() {
    local message="$1"
    local phone="${ADMIN_PHONE}"

    # 调用短信服务API
    curl -X POST "https://sms-api.example.com/send" \
        -d "phone=$phone" \
        -d "message=$message"
}
```

## 性能调优

### 数据库优化

#### PostgreSQL优化
```sql
-- 查看慢查询
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC;

-- 创建索引
CREATE INDEX CONCURRENTLY idx_posts_created_at ON posts(created_at);
CREATE INDEX CONCURRENTLY idx_posts_published ON posts(published) WHERE published = true;

-- 更新表统计信息
ANALYZE;

-- 重建索引
REINDEX INDEX CONCURRENTLY idx_posts_created_at;

-- 配置参数优化
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

#### Redis优化
```bash
# Redis配置优化
redis.conf:

# 内存优化
maxmemory 512mb
maxmemory-policy allkeys-lru

# 持久化优化
save 900 1
save 300 10
save 60 10000

# 网络优化
tcp-keepalive 300
timeout 0

# 安全优化
requirepass your_redis_password
```

### 应用优化

#### Node.js优化
```javascript
// 环境变量优化
process.env.NODE_OPTIONS = '--max-old-space-size=2048';

// 连接池优化
const pool = new Pool({
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 缓存优化
const cacheOptions = {
  max: 100,
  ttl: 1000 * 60 * 5, // 5分钟
};
```

#### Nginx优化
```nginx
# 性能优化配置
worker_processes auto;
worker_connections 1024;

# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# 缓存配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 缓冲区优化
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
```

## 日志管理

### 日志配置

#### 应用日志
```javascript
// winston日志配置
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

#### Nginx日志
```nginx
# 日志格式定义
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';

# 访问日志
access_log /var/log/nginx/access.log main;

# 错误日志
error_log /var/log/nginx/error.log warn;
```

### 日志轮转
```bash
# /etc/logrotate.d/personal-blog
/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose exec app kill -USR1 1
    endscript
}
```

### 日志分析

#### 使用ELK Stack
```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    ports:
      - "5044:5044"
    volumes:
      - ./logging/logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  elasticsearch_data:
```

#### 使用Grafana Loki
```yaml
# docker-compose.loki.yml
version: '3.8'

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki/loki.yml:/etc/loki/local-config.yaml
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./promtail/promtail.yml:/etc/promtail/config.yml
      - /app/logs:/var/log/app
    command: -config.file=/etc/promtail/config.yml
```

## 故障排查

### 故障排查流程

#### 1. 问题识别
```bash
# 检查服务状态
docker-compose ps

# 检查系统负载
uptime
top

# 检查磁盘空间
df -h

# 检查网络连接
ping yourdomain.com
curl -I http://localhost:3000
```

#### 2. 日志分析
```bash
# 查看应用日志
docker-compose logs -f app

# 查看Nginx日志
docker-compose logs -f nginx

# 查看数据库日志
docker-compose logs -f db

# 查看系统日志
sudo journalctl -f
```

#### 3. 性能分析
```bash
# 查看进程状态
ps aux
pstree

# 查看网络连接
netstat -tulpn
ss -tulpn

# 查看文件描述符
lsof -i
```

#### 4. 资源监控
```bash
# 实时监控
htop
iotop
iftop

# 系统统计
vmstat 1
iostat 1
sar 1
```

### 常见故障场景

#### 应用无响应
```bash
# 排查步骤
1. 检查应用进程状态
   docker-compose ps app

2. 检查应用日志
   docker-compose logs app

3. 检查端口占用
   netstat -tulpn | grep 3000

4. 检查资源使用
   docker stats

5. 重启应用
   docker-compose restart app
```

#### 数据库连接问题
```bash
# 排查步骤
1. 检查数据库服务状态
   docker-compose ps db

2. 测试数据库连接
   docker-compose exec db pg_isready

3. 检查连接数
   docker-compose exec db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

4. 检查数据库日志
   docker-compose logs db

5. 重启数据库
   docker-compose restart db
```

#### 网络问题
```bash
# 排查步骤
1. 检查网络连接
   ping 8.8.8.8

2. 检查DNS解析
   nslookup yourdomain.com

3. 检查端口开放
   telnet localhost 3000

4. 检查防火墙
   sudo ufw status

5. 检查Nginx配置
   docker-compose exec nginx nginx -t
```

### 性能问题排查

#### 响应时间慢
```bash
# 分析响应时间
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000

# 检查数据库查询
docker-compose exec db psql -U postgres -c "
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# 检查缓存命中率
docker-compose exec redis redis-cli info stats | grep keyspace
```

#### 内存使用过高
```bash
# 检查内存使用
free -h
docker stats

# 分析进程内存
ps aux --sort=-%mem | head

# 检查Node.js内存
docker-compose exec app node -e "console.log(process.memoryUsage())"
```

#### CPU使用过高
```bash
# 检查CPU使用
top
htop

# 分析进程CPU
ps aux --sort=-%cpu | head

# 检查系统调用
strace -p <PID>
```

### 自动化故障处理

#### 自动重启脚本
```bash
#!/bin/bash
# scripts/auto-recovery.sh

check_and_restart() {
    local service="$1"
    local health_url="$2"

    if ! curl -f "$health_url" >/dev/null 2>&1; then
        echo "服务 $service 健康检查失败，尝试重启..."
        docker-compose restart "$service"
        sleep 30

        if curl -f "$health_url" >/dev/null 2>&1; then
            echo "服务 $service 重启成功"
            # 发送恢复通知
            send_notification "服务 $service 已自动恢复"
        else
            echo "服务 $service 重启失败，需要人工干预"
            # 发送告警通知
            send_alert "服务 $service 自动恢复失败"
        fi
    fi
}

# 检查关键服务
check_and_restart "app" "http://localhost:3000/api/health"
check_and_restart "nginx" "http://localhost/health"
```

#### 监控脚本定时任务
```bash
# 添加到crontab
# 每5分钟检查一次服务状态
*/5 * * * * /opt/personal-blog/scripts/monitoring/app-monitor.sh

# 每小时检查一次系统资源
0 * * * * /opt/personal-blog/scripts/monitoring/system-monitor.sh

# 每天检查一次磁盘空间
0 2 * * * /opt/personal-blog/scripts/monitoring/disk-monitor.sh
```

---

**注意**: 监控系统本身也会消耗资源，请根据实际情况调整监控频率和粒度。