# 个人博客后端 API 系统

## 项目概述

这是一个功能完整的个人博客后端API系统，基于现代化的技术栈构建，提供了高性能、安全可靠的博客服务。

### 🚀 核心特性

- **用户认证**: JWT令牌认证，支持注册、登录、自动刷新
- **文章管理**: 完整的CRUD操作，支持草稿、发布、特色文章
- **评论系统**: 嵌套评论、回复、点赞功能
- **搜索功能**: 全文搜索、搜索建议、热门搜索
- **文件上传**: 安全的文件上传，支持图片处理
- **缓存系统**: Redis缓存提升性能
- **安全防护**: 限流、CORS、安全头部、输入验证
- **权限控制**: 基于角色的访问控制

### 🛠️ 技术栈

- **后端框架**: Next.js 14 API Routes
- **数据库**: PostgreSQL + Prisma ORM
- **缓存**: Redis
- **认证**: JWT (Access Token + Refresh Token)
- **文件存储**: 本地存储 (可扩展云存储)
- **安全**: bcrypt, rate-limiter, CORS
- **类型安全**: TypeScript
- **代码质量**: ESLint + Prettier

### 📁 项目结构

```
personal-blog/
├── src/
│   ├── app/api/                 # API路由
│   │   ├── auth/               # 认证相关API
│   │   │   ├── register/       # 用户注册
│   │   │   ├── login/          # 用户登录
│   │   │   ├── logout/         # 用户登出
│   │   │   ├── refresh/        # 刷新Token
│   │   │   └── me/             # 获取当前用户
│   │   ├── posts/              # 文章管理API
│   │   │   ├── route.ts        # 文章列表/创建
│   │   │   ├── [slug]/         # 单个文章操作
│   │   │   ├── popular/        # 热门文章
│   │   │   ├── featured/       # 特色文章
│   │   │   ├── tags/           # 标签管理
│   │   │   └── [slug]/like/    # 文章点赞
│   │   ├── comments/           # 评论系统API
│   │   │   ├── route.ts        # 评论列表/创建
│   │   │   └── [id]/           # 单个评论操作
│   │   ├── search/             # 搜索功能API
│   │   │   ├── route.ts        # 全局搜索
│   │   │   ├── suggestions/    # 搜索建议
│   │   │   └── popular/        # 热门搜索
│   │   └── upload/             # 文件上传API
│   │       ├── route.ts        # 文件上传/列表
│   │       ├── [id]/           # 文件管理
│   │       └── cleanup/        # 文件清理
│   └── lib/
│       ├── auth/               # 认证工具
│       │   ├── jwt.ts          # JWT服务
│       │   └── middleware.ts   # 认证中间件
│       ├── services/           # 业务逻辑服务
│       │   ├── user.service.ts # 用户服务
│       │   ├── post.service.ts # 文章服务
│       │   ├── comment.service.ts # 评论服务
│       │   ├── like.service.ts # 点赞服务
│       │   ├── search.service.ts # 搜索服务
│       │   └── upload.service.ts # 上传服务
│       ├── utils/              # 工具函数
│       │   ├── validation.ts   # 数据验证
│       │   └── rate-limiter.ts # 限流工具
│       ├── db/                 # 数据库配置
│       │   └── prisma.ts       # Prisma客户端
│       └── cache/              # 缓存服务
│           └── redis.ts        # Redis服务
├── prisma/
│   ├── schema.prisma           # 数据库模式
│   ├── migrations/             # 数据库迁移
│   └── seed.ts                 # 种子数据
├── public/uploads/             # 文件上传目录
├── API_DOCUMENTATION.md        # API文档
├── API_EXAMPLES.md            # 使用示例
└── README_API.md              # 项目说明
```

## 🗄️ 数据库设计

### 核心模型

- **User**: 用户模型，支持角色管理
- **Post**: 文章模型，支持标签、分类、发布状态
- **Comment**: 评论模型，支持嵌套回复
- **Like**: 点赞模型，文章点赞功能
- **Category**: 分类模型
- **FileUpload**: 文件上传记录
- **RefreshToken**: 刷新令牌管理
- **Notification**: 通知系统

### 关系设计

- 用户一对多文章
- 文章一对多评论
- 评论自关联实现嵌套
- 用户多对多文章通过点赞关联

## 🔐 安全特性

### 认证安全

- JWT双令牌机制 (Access Token + Refresh Token)
- 密码bcrypt加密存储
- Token自动刷新
- 会话管理

### API安全

- 请求限流防刷
- CORS跨域控制
- 安全HTTP头部
- 输入数据验证
- SQL注入防护
- XSS攻击防护

### 文件安全

- 文件类型验证
- 文件大小限制
- 安全文件名生成
- 路径遍历防护

## ⚡ 性能优化

### 缓存策略

- **文章详情**: 1小时缓存
- **文章列表**: 30分钟缓存
- **热门内容**: 1小时缓存
- **搜索结果**: 30分钟缓存
- **用户会话**: 2小时缓存

### 数据库优化

- 关键字段索引
- 查询字段选择
- 分页查询优化
- 连接池管理

### 响应优化

- 请求处理时间监控
- Gzip压缩
- 静态资源缓存

## 🚦 限流规则

| 端点类型 | 时间窗口 | 最大请求数 | 说明         |
| -------- | -------- | ---------- | ------------ |
| 通用API  | 15分钟   | 100次      | 常规API调用  |
| 认证API  | 15分钟   | 5次        | 登录注册限制 |
| 注册API  | 1小时    | 3次        | 防止恶意注册 |
| 文件上传 | 1小时    | 20次       | 上传频率限制 |
| 搜索API  | 1分钟    | 30次       | 搜索频率限制 |
| 评论API  | 1分钟    | 5次        | 评论发布限制 |
| 点赞API  | 1分钟    | 20次       | 点赞操作限制 |

## 📚 API文档

### 主要端点

#### 认证相关

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新Token
- `GET /api/auth/me` - 获取当前用户

#### 文章管理

- `GET /api/posts` - 获取文章列表
- `POST /api/posts` - 创建文章
- `GET /api/posts/[slug]` - 获取单个文章
- `PUT /api/posts/[slug]` - 更新文章
- `DELETE /api/posts/[slug]` - 删除文章
- `POST /api/posts/[slug]/like` - 文章点赞

#### 评论系统

- `GET /api/comments` - 获取评论列表
- `POST /api/comments` - 创建评论
- `PUT /api/comments/[id]` - 更新评论
- `DELETE /api/comments/[id]` - 删除评论

#### 搜索功能

- `GET /api/search` - 全局搜索
- `GET /api/search/suggestions` - 搜索建议
- `GET /api/search/popular` - 热门搜索

#### 文件上传

- `POST /api/upload` - 上传文件
- `GET /api/upload` - 获取文件列表
- `DELETE /api/upload/[id]` - 删除文件

详细文档请参考 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🛠️ 快速开始

### 1. 环境准备

```bash
# 克隆项目
git clone <repository-url>
cd personal-blog

# 安装依赖
npm install

# 复制环境变量配置
cp .env.example .env.local

# 配置环境变量 (重要!)
```

### 2. 环境变量配置

编辑 `.env.local` 文件：

```env
# 数据库
DATABASE_URL="postgresql://postgres:password@localhost:5432/personal_blog"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT配置 (必须设置强密码)
JWT_SECRET="your-jwt-secret-key-here-min-32-chars"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key-here-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. 数据库设置

```bash
# 启动PostgreSQL和Redis (使用Docker)
docker-compose up -d

# 运行数据库迁移
npm run db:migrate

# 生成Prisma客户端
npm run db:generate

# 可选：填充种子数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 或启动生产模式
npm run build
npm start
```

### 5. 验证安装

访问 `http://localhost:3000/api/posts` 验证API是否正常工作。

## 🧪 测试API

### 使用curl测试

```bash
# 获取文章列表
curl http://localhost:3000/api/posts

# 用户注册
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123!",
    "name": "Test User"
  }'

# 用户登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### 使用Postman

1. 导入API文档到Postman
2. 设置环境变量
3. 先调用登录接口获取Token
4. 在需要认证的接口中添加Authorization头部

## 🔧 开发指南

### 添加新的API端点

1. **创建路由文件**

   ```bash
   # 在 src/app/api/ 下创建新路由
   touch src/app/api/new-feature/route.ts
   ```

2. **创建服务类**

   ```bash
   # 在 src/lib/services/ 下创建服务
   touch src/lib/services/new-feature.service.ts
   ```

3. **实现业务逻辑**

   ```typescript
   // new-feature.service.ts
   export class NewFeatureService {
     static async createNewFeature(data: any) {
       // 实现业务逻辑
     }
   }
   ```

4. **创建API路由**

   ```typescript
   // route.ts
   import { NewFeatureService } from '@/lib/services/new-feature.service'

   export async function POST(request: NextRequest) {
     // 处理请求
   }
   ```

5. **添加认证和权限**

   ```typescript
   import { withAuth } from '@/lib/auth/middleware'

   export const POST = withAuth(handler, { required: true })
   ```

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint和Prettier规则
- API返回统一格式
- 完整的错误处理
- 详细的注释说明

### 数据库迁移

```bash
# 修改Prisma schema后
npx prisma db push  # 开发环境
npx prisma migrate dev --name migration-name  # 生产环境
```

## 🚀 部署指南

### 环境准备

1. **服务器要求**
   - Node.js 18+
   - PostgreSQL 14+
   - Redis 6+

2. **环境变量**
   ```env
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   JWT_SECRET=强密码
   JWT_REFRESH_SECRET=强密码
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

### 部署步骤

1. **构建项目**

   ```bash
   npm run build
   ```

2. **运行数据库迁移**

   ```bash
   npm run db:migrate
   ```

3. **启动应用**

   ```bash
   npm start
   ```

4. **使用PM2管理进程**
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   ```

### Docker部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# 构建和运行
docker build -t personal-blog-api .
docker run -p 3000:3000 --env-file .env personal-blog-api
```

## 🔍 监控和日志

### 日志记录

- 请求日志自动记录
- 错误日志详细输出
- 性能监控时间戳

### 健康检查

```bash
# 检查API状态
curl http://localhost:3000/api/posts

# 检查数据库连接
curl http://localhost:3000/api/auth/me
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题或建议，请：

1. 查看API文档
2. 检查常见问题
3. 提交Issue
4. 联系开发团队

---

**注意**: 这是一个完整的后端API系统，前端需要单独开发或集成现有的前端框架。
