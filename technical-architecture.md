# 个人博客网站技术架构设计

## 1. 系统整体架构

### 1.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
├─────────────────────────────────────────────────────────────┤
│  Web浏览器  │  移动端浏览器  │  管理后台  │  RSS阅读器      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CDN + 负载均衡                         │
│                   (CloudFlare / Nginx)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      应用层 (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 18)  │  API Routes  │  Middleware层       │
│  - 用户界面            │  - RESTful   │  - 认证授权          │
│  - 组件库(Shadcn/ui)   │  - GraphQL   │  - 请求验证          │
│  - 状态管理            │  - WebSocket │  - 错误处理          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据访问层                            │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM  │  Redis缓存  │  文件存储  │  搜索引擎         │
│  - 查询优化   │  - 会话缓存  │  - 图片/文件 │  - 全文搜索      │
│  - 事务管理   │  - 数据缓存  │  - CDN存储  │  - 索引管理      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        数据存储层                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (主数据库)  │  Redis (缓存/会话)               │
│  - 文章数据             │  - 用户会话                      │
│  - 用户数据             │  - 热点数据缓存                  │
│  - 评论数据             │  - 排行榜                        │
│  - 系统配置             │  - 计数器                        │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈详细说明

#### 前端技术栈

- **Next.js 14**: 全栈React框架，支持SSR/SSG/ISR
- **React 18**: 用户界面库，支持并发特性
- **TypeScript**: 类型安全的JavaScript超集
- **Tailwind CSS**: 实用优先的CSS框架
- **Shadcn/ui**: 基于Radix UI的组件库
- **React Hook Form**: 表单状态管理
- **Zustand**: 轻量级状态管理
- **Framer Motion**: 动画库

#### 后端技术栈

- **Next.js API Routes**: 服务端API
- **Prisma ORM**: 现代化数据库工具
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **NextAuth.js**: 身份认证
- **Zod**: 运行时类型验证
- **Winston**: 日志记录

#### 部署和运维

- **Docker**: 容器化部署
- **Docker Compose**: 本地开发环境
- **Nginx**: 反向代理和静态文件服务
- **GitHub Actions**: CI/CD流水线
- **Vercel Analytics**: 性能监控

## 2. 数据库设计

### 2.1 数据库关系图

```
User (用户表)
├── id: UUID (PK)
├── email: String (Unique)
├── name: String
├── role: Enum (ADMIN, USER)
├── avatar: String?
├── bio: String?
├── createdAt: DateTime
└── updatedAt: DateTime

Post (文章表)
├── id: UUID (PK)
├── title: String
├── slug: String (Unique)
├── content: Text
├── excerpt: String?
├── coverImage: String?
├── status: Enum (DRAFT, PUBLISHED, ARCHIVED)
├── publishedAt: DateTime?
├── viewCount: Int (Default: 0)
├── likeCount: Int (Default: 0)
├── authorId: UUID (FK → User.id)
├── createdAt: DateTime
└── updatedAt: DateTime

Category (分类表)
├── id: UUID (PK)
├── name: String (Unique)
├── slug: String (Unique)
├── description: String?
├── color: String?
├── createdAt: DateTime
└── updatedAt: DateTime

Tag (标签表)
├── id: UUID (PK)
├── name: String (Unique)
├── slug: String (Unique)
├── createdAt: DateTime
└── updatedAt: DateTime

PostCategory (文章分类关联表)
├── postId: UUID (FK → Post.id)
├── categoryId: UUID (FK → Category.id)
└── createdAt: DateTime

PostTag (文章标签关联表)
├── postId: UUID (FK → Post.id)
├── tagId: UUID (FK → Tag.id)
└── createdAt: DateTime

Comment (评论表)
├── id: UUID (PK)
├── content: Text
├── authorName: String
├── authorEmail: String
├── authorWebsite: String?
├── status: Enum (PENDING, APPROVED, REJECTED)
├── postId: UUID (FK → Post.id)
├── parentId: UUID? (FK → Comment.id)
├── userId: UUID? (FK → User.id)
├── createdAt: DateTime
└── updatedAt: DateTime

View (访问记录表)
├── id: UUID (PK)
├── postId: UUID (FK → Post.id)
├── ipAddress: String
├── userAgent: String
├── referer: String?
├── createdAt: DateTime
└── updatedAt: DateTime

Subscription (订阅表)
├── id: UUID (PK)
├── email: String (Unique)
├── status: Enum (ACTIVE, UNSUBSCRIBED)
├── token: String (Unique)
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 2.2 Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  avatar    String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts    Post[]
  comments Comment[]

  @@map("users")
}

model Post {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  content     String
  excerpt     String?
  coverImage  String?
  status      PostStatus  @default(DRAFT)
  publishedAt DateTime?
  viewCount   Int         @default(0)
  likeCount   Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)

  categories PostCategory[]
  tags       PostTag[]
  comments   Comment[]
  views      View[]

  @@map("posts")
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  color       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  posts PostCategory[]

  @@map("categories")
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  posts PostTag[]

  @@map("tags")
}

model PostCategory {
  postId     String
  categoryId String
  createdAt  DateTime @default(now())

  post     Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
  @@map("post_categories")
}

model PostTag {
  postId   String
  tagId    String
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

model Comment {
  id           String        @id @default(cuid())
  content      String
  authorName   String
  authorEmail  String
  authorWebsite String?
  status       CommentStatus @default(PENDING)
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  parentId String?
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies  Comment[] @relation("CommentReplies")

  userId String?
  user   User?   @relation(fields: [userId], references: [id])

  @@map("comments")
}

model View {
  id        String   @id @default(cuid())
  ipAddress String
  userAgent String
  referer   String?
  createdAt DateTime @default(now())

  postId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("views")
}

model Subscription {
  id        String              @id @default(cuid())
  email     String              @unique
  status    SubscriptionStatus  @default(ACTIVE)
  token     String              @unique
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  @@map("subscriptions")
}

enum Role {
  ADMIN
  USER
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum SubscriptionStatus {
  ACTIVE
  UNSUBSCRIBED
}
```

## 3. API设计规范

### 3.1 RESTful API设计原则

#### URL命名规范

- 使用名词复数形式: `/api/posts`, `/api/comments`
- 使用kebab-case: `/api/blog-posts`
- 资源嵌套: `/api/posts/{postId}/comments`

#### HTTP方法使用

- `GET`: 获取资源
- `POST`: 创建资源
- `PUT`/`PATCH`: 更新资源
- `DELETE`: 删除资源

#### 状态码规范

- `200`: 成功
- `201`: 创建成功
- `400`: 请求错误
- `401`: 未认证
- `403`: 无权限
- `404`: 资源不存在
- `500`: 服务器错误

### 3.2 API端点设计

#### 文章管理API

```typescript
// GET /api/posts - 获取文章列表
// Query Parameters: page, limit, category, tag, search, status
interface GetPostsQuery {
  page?: number
  limit?: number
  category?: string
  tag?: string
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

// GET /api/posts/[slug] - 获取单篇文章
// Response: Post详情 + 评论列表

// POST /api/posts - 创建文章
interface CreatePostRequest {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  status: 'DRAFT' | 'PUBLISHED'
  categoryIds: string[]
  tagIds: string[]
}

// PUT /api/posts/[id] - 更新文章
interface UpdatePostRequest {
  title?: string
  content?: string
  excerpt?: string
  coverImage?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  categoryIds?: string[]
  tagIds?: string[]
}

// DELETE /api/posts/[id] - 删除文章
```

#### 评论管理API

```typescript
// GET /api/posts/[postId]/comments - 获取文章评论
// Query Parameters: page, limit

// POST /api/posts/[postId]/comments - 创建评论
interface CreateCommentRequest {
  content: string
  authorName: string
  authorEmail: string
  authorWebsite?: string
  parentId?: string
}

// PUT /api/comments/[id]/status - 更新评论状态
interface UpdateCommentStatusRequest {
  status: 'APPROVED' | 'REJECTED'
}
```

#### 分类和标签API

```typescript
// GET /api/categories - 获取分类列表
// POST /api/categories - 创建分类
// PUT /api/categories/[id] - 更新分类
// DELETE /api/categories/[id] - 删除分类

// GET /api/tags - 获取标签列表
// POST /api/tags - 创建标签
// PUT /api/tags/[id] - 更新标签
// DELETE /api/tags/[id] - 删除标签
```

#### 统计分析API

```typescript
// GET /api/analytics/overview - 总览统计
interface AnalyticsOverview {
  totalPosts: number
  totalViews: number
  totalComments: number
  monthlyViews: number
  popularPosts: Post[]
}

// GET /api/analytics/posts/[id]/views - 文章访问统计
// GET /api/analytics/posts/[id]/timeline - 文章访问时间线
```

### 3.3 API响应格式标准

```typescript
// 成功响应格式
interface SuccessResponse<T> {
  success: true
  data: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 错误响应格式
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

// 分页响应示例
interface PaginatedPostsResponse extends SuccessResponse<Post[]> {
  pagination: {
    page: 1
    limit: 10
    total: 100
    totalPages: 10
  }
}
```

## 4. 安全架构设计

### 4.1 身份认证和授权

#### JWT认证流程

```
用户登录 → 验证凭据 → 生成JWT → 返回Token
         ↓
API请求 → 验证Token → 解析用户信息 → 授权检查 → 处理请求
```

#### 权限控制模型

```typescript
enum Permission {
  // 文章权限
  READ_POST = 'read:post',
  CREATE_POST = 'create:post',
  UPDATE_POST = 'update:post',
  DELETE_POST = 'delete:post',

  // 评论权限
  READ_COMMENT = 'read:comment',
  CREATE_COMMENT = 'create:comment',
  MODERATE_COMMENT = 'moderate:comment',

  // 管理权限
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_SETTINGS = 'manage:settings',
}

interface RolePermissions {
  [key: string]: Permission[]
}

const rolePermissions: RolePermissions = {
  ADMIN: [
    Permission.READ_POST,
    Permission.CREATE_POST,
    Permission.UPDATE_POST,
    Permission.DELETE_POST,
    Permission.READ_COMMENT,
    Permission.CREATE_COMMENT,
    Permission.MODERATE_COMMENT,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_SETTINGS,
  ],
  USER: [Permission.READ_POST, Permission.CREATE_COMMENT],
}
```

### 4.2 数据安全措施

#### 输入验证和清理

```typescript
// 使用Zod进行运行时验证
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  categoryIds: z.array(z.string().uuid()),
  tagIds: z.array(z.string().uuid()),
})

// XSS防护
import DOMPurify from 'dompurify'

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html)
}
```

#### SQL注入防护

- 使用Prisma ORM自动参数化查询
- 避免原生SQL查询
- 输入验证和类型检查

#### CSRF防护

- 使用CSRF Token
- SameSite Cookie设置
- 验证Referer头

### 4.3 安全中间件

```typescript
// rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: 'Too many requests',
})

// helmet安全头
import helmet from 'helmet'

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
)

// CORS配置
import cors from 'cors'

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })
)
```

## 5. 性能优化策略

### 5.1 前端性能优化

#### 代码分割和懒加载

```typescript
// 动态导入组件
const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

// 路由级代码分割
const router = {
  '/': () => import('@/pages/HomePage'),
  '/admin': () => import('@/pages/AdminPage'),
  '/posts/[slug]': () => import('@/pages/PostPage'),
};
```

#### 图片优化

```typescript
// Next.js Image组件
import Image from 'next/image';

<Image
  src="/blog-cover.jpg"
  alt="Blog cover"
  width={800}
  height={400}
  priority={isAboveFold}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### 缓存策略

```typescript
// 页面级缓存
export async function getStaticProps() {
  const posts = await getPosts()

  return {
    props: { posts },
    revalidate: 60, // 60秒重新生成
  }
}

// 数据缓存
import { cache } from 'react'

export const getPosts = cache(async () => {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    include: { author: true },
  })
})
```

### 5.2 后端性能优化

#### 数据库优化

```typescript
// 索引优化
model Post {
  // ...

  @@index([status, publishedAt])
  @@index([authorId])
  @@index([slug])
}

// 查询优化
const getPostsWithPagination = async (page: number, limit: number) => {
  return prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      author: { select: { name: true, avatar: true } },
      categories: { include: { category: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { publishedAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
};
```

#### Redis缓存

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

// 缓存热门文章
const getPopularPosts = async () => {
  const cacheKey = 'popular_posts'
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { viewCount: 'desc' },
    take: 10,
  })

  await redis.setex(cacheKey, 300, JSON.stringify(posts)) // 5分钟缓存
  return posts
}
```

### 5.3 监控和分析

```typescript
// 性能监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // 发送到分析服务
  fetch('/api/analytics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metric),
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

这份技术架构设计为个人博客网站提供了完整的技术实现指导，确保系统的可扩展性、安全性和高性能。接下来我将制定详细的开发计划。
