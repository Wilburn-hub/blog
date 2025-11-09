# 个人博客后端 API 文档

## 概述

这是一个完整的个人博客后端API系统，基于 Next.js API Routes、Prisma ORM、PostgreSQL 和 Redis 构建。提供了用户认证、文章管理、评论系统、搜索功能和文件上传等核心功能。

### 技术栈

- **框架**: Next.js 14 API Routes
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **缓存**: Redis
- **认证**: JWT
- **文件上传**: 本地存储 (支持扩展至云存储)
- **安全**: 限流、CORS、安全头部设置

### 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证说明

### JWT Token 结构

```json
{
  "userId": "string",
  "email": "string",
  "username": "string",
  "role": "USER|ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token 获取方式

1. **登录**: 使用 `/api/auth/login` 获取 access_token 和 refresh_token
2. **Token 刷新**: 使用 `/api/auth/refresh` 刷新 access_token
3. **Token 存储**: Token 通过 HTTP-only Cookie 存储

### 认证头部

```
Authorization: Bearer <access_token>
```

## API 端点

### 1. 用户认证 (Authentication)

#### 1.1 用户注册

```http
POST /api/auth/register
```

**请求体**:

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "Password123!",
  "name": "User Name"
}
```

**响应** (201):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 1.2 用户登录

```http
POST /api/auth/login
```

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**响应** (200):

```json
{
  "message": "Login successful",
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name",
    "role": "USER",
    "isActive": true,
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "expiresAt": "2024-01-01T00:15:00.000Z"
}
```

**Cookies**:

- `access_token`: HTTP-only, 15分钟过期
- `refresh_token`: HTTP-only, 7天过期

#### 1.3 用户登出

```http
POST /api/auth/logout
```

**认证**: Required

**响应** (200):

```json
{
  "message": "Logout successful"
}
```

#### 1.4 刷新Token

```http
POST /api/auth/refresh
```

**响应** (200):

```json
{
  "message": "Token refreshed successfully",
  "expiresAt": "2024-01-01T00:15:00.000Z"
}
```

#### 1.5 获取当前用户信息

```http
GET /api/auth/me
```

**认证**: Required

**响应** (200):

```json
{
  "user": {
    "id": "cuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name",
    "avatar": "http://example.com/avatar.jpg",
    "bio": "User bio",
    "website": "https://example.com",
    "location": "City, Country",
    "role": "USER",
    "isActive": true,
    "emailVerified": null,
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "stats": {
      "postsCount": 10,
      "commentsCount": 25,
      "likesCount": 50
    }
  }
}
```

### 2. 文章管理 (Posts)

#### 2.1 获取文章列表

```http
GET /api/posts
```

**查询参数**:

- `page` (number, 默认: 1): 页码
- `limit` (number, 默认: 10): 每页数量
- `published` (boolean, 默认: true): 是否已发布
- `featured` (boolean): 是否特色文章
- `authorId` (string): 作者ID
- `tags` (string): 标签，多个用逗号分隔
- `category` (string): 分类slug
- `search` (string): 搜索关键词
- `sort` (string): 排序方式 (latest, oldest, popular, views)

**响应** (200):

```json
{
  "posts": [
    {
      "id": "cuid",
      "title": "文章标题",
      "slug": "article-slug",
      "excerpt": "文章摘要",
      "content": "文章内容",
      "coverImage": "http://example.com/cover.jpg",
      "published": true,
      "featured": false,
      "tags": ["tag1", "tag2"],
      "readingTime": 5,
      "viewCount": 100,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "cuid",
        "username": "username",
        "name": "Author Name",
        "avatar": "http://example.com/avatar.jpg"
      },
      "categories": [
        {
          "id": "cuid",
          "name": "Category Name",
          "slug": "category-slug",
          "color": "#FF5733"
        }
      ],
      "_count": {
        "comments": 10,
        "likes": 25
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### 2.2 创建文章

```http
POST /api/posts
```

**认证**: Required

**请求体**:

```json
{
  "title": "文章标题",
  "content": "文章内容",
  "excerpt": "文章摘要",
  "coverImage": "http://example.com/cover.jpg",
  "tags": ["tag1", "tag2"],
  "featured": false,
  "published": false,
  "categoryIds": ["category-id-1", "category-id-2"]
}
```

**响应** (201):

```json
{
  "message": "Post created successfully",
  "post": {
    // 同上文章对象结构
  }
}
```

#### 2.3 获取单个文章

```http
GET /api/posts/{slug}
```

**响应** (200): 同文章对象结构

**注意**: 每次访问已发布文章都会增加浏览量

#### 2.4 更新文章

```http
PUT /api/posts/{slug}
```

**认证**: Required (作者或管理员)

**请求体**: 同创建文章，所有字段可选

**响应** (200):

```json
{
  "message": "Post updated successfully",
  "post": {
    // 更新后的文章对象
  }
}
```

#### 2.5 删除文章

```http
DELETE /api/posts/{slug}
```

**认证**: Required (作者或管理员)

**响应** (200):

```json
{
  "message": "Post deleted successfully"
}
```

#### 2.6 获取热门文章

```http
GET /api/posts/popular
```

**查询参数**:

- `limit` (number, 默认: 5): 返回数量

#### 2.7 获取特色文章

```http
GET /api/posts/featured
```

**查询参数**:

- `limit` (number, 默认: 5): 返回数量

#### 2.8 获取标签列表

```http
GET /api/posts/tags
```

**响应** (200):

```json
{
  "tags": [
    {
      "name": "javascript",
      "count": 25
    },
    {
      "name": "react",
      "count": 18
    }
  ],
  "count": 2
}
```

#### 2.9 按标签获取文章

```http
GET /api/posts/tags/{tag}
```

**查询参数**:

- `page` (number, 默认: 1): 页码
- `limit` (number, 默认: 10): 每页数量

#### 2.10 文章点赞

```http
POST /api/posts/{slug}/like
```

**认证**: Required

**响应** (200):

```json
{
  "message": "Post liked successfully",
  "liked": true,
  "likeCount": 26
}
```

```http
GET /api/posts/{slug}/like
```

**响应** (200):

```json
{
  "likeCount": 25,
  "userLiked": false
}
```

### 3. 评论系统 (Comments)

#### 3.1 获取评论列表

```http
GET /api/comments
```

**查询参数**:

- `page` (number, 默认: 1): 页码
- `limit` (number, 默认: 10): 每页数量
- `postId` (string): 文章ID
- `authorId` (string): 作者ID
- `parentId` (string): 父评论ID (null表示顶级评论)
- `sortBy` (string): 排序方式 (latest, oldest, popular)
- `search` (string): 搜索关键词

**响应** (200):

```json
{
  "comments": [
    {
      "id": "cuid",
      "content": "评论内容",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "author": {
        "id": "cuid",
        "username": "username",
        "name": "User Name",
        "avatar": "http://example.com/avatar.jpg"
      },
      "post": {
        "id": "cuid",
        "title": "文章标题",
        "slug": "article-slug"
      },
      "parent": {
        "id": "cuid",
        "content": "父评论内容",
        "author": {
          "id": "cuid",
          "username": "parent_username",
          "name": "Parent User"
        }
      },
      "_count": {
        "replies": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### 3.2 创建评论

```http
POST /api/comments
```

**认证**: Required

**请求体**:

```json
{
  "content": "评论内容",
  "postId": "post-id",
  "parentId": "parent-comment-id" // 可选，用于回复
}
```

**响应** (201):

```json
{
  "message": "Comment created successfully",
  "comment": {
    // 同评论对象结构
  }
}
```

#### 3.3 获取单个评论

```http
GET /api/comments/{id}
```

**响应** (200): 包含回复的完整评论对象

#### 3.4 更新评论

```http
PUT /api/comments/{id}
```

**认证**: Required (评论作者或管理员)

**请求体**:

```json
{
  "content": "更新后的评论内容"
}
```

#### 3.5 删除评论

```http
DELETE /api/comments/{id}
```

**认证**: Required (评论作者或管理员)

### 4. 搜索功能 (Search)

#### 4.1 全局搜索

```http
GET /api/search
```

**查询参数**:

- `q` (string, 必需): 搜索关键词
- `type` (string, 默认: "all"): 搜索类型 (all, posts, users, comments)
- `page` (number, 默认: 1): 页码
- `limit` (number, 默认: 10): 每页数量
- `tags` (string): 标签过滤
- `category` (string): 分类过滤
- `author` (string): 作者过滤
- `dateFrom` (string): 开始日期
- `dateTo` (string): 结束日期
- `sortBy` (string, 默认: "relevance"): 排序方式

**响应** (200):

```json
{
  "posts": [
    // 文章对象数组
  ],
  "users": [
    // 用户对象数组
  ],
  "comments": [
    // 评论对象数组
  ],
  "total": {
    "posts": 10,
    "users": 5,
    "comments": 8,
    "all": 23
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 23,
    "pages": 3
  },
  "query": "javascript",
  "type": "all"
}
```

#### 4.2 搜索建议

```http
GET /api/search/suggestions
```

**查询参数**:

- `q` (string, 必需): 搜索关键词
- `limit` (number, 默认: 10): 建议数量

**响应** (200):

```json
{
  "suggestions": [
    {
      "type": "post",
      "title": "JavaScript 基础教程",
      "slug": "javascript-basics"
    },
    {
      "type": "user",
      "username": "js_expert",
      "name": "JavaScript Expert",
      "avatar": "http://example.com/avatar.jpg"
    }
  ],
  "tags": [
    {
      "name": "javascript",
      "count": 25
    },
    {
      "name": "react",
      "count": 18
    }
  ]
}
```

#### 4.3 热门搜索

```http
GET /api/search/popular
```

**查询参数**:

- `limit` (number, 默认: 10): 返回数量

### 5. 文件上传 (Upload)

#### 5.1 上传文件

```http
POST /api/upload
```

**认证**: Required

**请求**: `multipart/form-data`

- `file` (File, 必需): 要上传的文件
- `directory` (string, 默认: "images"): 存储目录
- `maxSize` (number): 最大文件大小 (字节)
- `generateThumbnail` (boolean): 是否生成缩略图

**响应** (201):

```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": "cuid",
    "originalName": "image.jpg",
    "filename": "unique-filename.jpg",
    "mimetype": "image/jpeg",
    "size": 1024000,
    "path": "/full/path/to/file",
    "url": "/uploads/images/unique-filename.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sizeFormatted": "1.0 MB",
    "isImage": true
  }
}
```

**支持的文件类型**:

- image/jpeg
- image/jpg
- image/png
- image/gif
- image/webp

**文件大小限制**: 默认 5MB

#### 5.2 获取文件列表

```http
GET /api/upload
```

**认证**: Required

**查询参数**:

- `page` (number, 默认: 1): 页码
- `limit` (number, 默认: 20): 每页数量
- `type` (string): 文件类型过滤

#### 5.3 获取单个文件信息

```http
GET /api/upload/{id}
```

#### 5.4 删除文件

```http
DELETE /api/upload/{id}
```

**认证**: Required

#### 5.5 清理无用文件 (管理员)

```http
POST /api/upload/cleanup
```

**认证**: Required (管理员)

**查询参数**:

- `olderThanDays` (number, 默认: 30): 清理多少天前的文件

## 错误响应

### 标准错误格式

```json
{
  "error": "错误消息",
  "details": [
    {
      "field": "字段名",
      "message": "具体错误信息"
    }
  ]
}
```

### HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突 (如用户名已存在)
- `429` - 请求过于频繁
- `500` - 服务器内部错误

## 限流规则

| 端点类型 | 时间窗口 | 最大请求数 |
| -------- | -------- | ---------- |
| 通用API  | 15分钟   | 100次      |
| 认证API  | 15分钟   | 5次        |
| 注册API  | 1小时    | 3次        |
| 文件上传 | 1小时    | 20次       |
| 搜索API  | 1分钟    | 30次       |
| 评论API  | 1分钟    | 5次        |
| 点赞API  | 1分钟    | 20次       |

## 安全特性

1. **JWT认证**: 安全的token认证机制
2. **密码加密**: bcrypt加密存储
3. **HTTPS强制**: 生产环境强制HTTPS
4. **CORS配置**: 可配置的跨域策略
5. **安全头部**: 完整的HTTP安全头部
6. **输入验证**: 严格的输入数据验证
7. **SQL注入防护**: Prisma ORM自动防护
8. **XSS防护**: 内容安全策略

## 缓存策略

- **文章详情**: 1小时
- **文章列表**: 30分钟
- **热门文章**: 1小时
- **搜索结果**: 30分钟
- **标签列表**: 1小时
- **用户会话**: 2小时

## 性能优化

1. **数据库索引**: 关键字段建立索引
2. **Redis缓存**: 热门数据缓存
3. **分页查询**: 避免大量数据加载
4. **字段选择**: 只查询必要字段
5. **连接池**: 数据库连接复用
6. **图片优化**: 支持图片压缩

## 部署建议

### 环境变量配置

参考 `.env.example` 文件配置必要的环境变量。

### 数据库迁移

```bash
npm run db:migrate
```

### 生成Prisma客户端

```bash
npm run db:generate
```

### 生产部署建议

1. 使用HTTPS
2. 配置CDN加速静态资源
3. 设置监控和日志
4. 定期备份数据库
5. 配置Redis持久化
6. 设置健康检查

## 开发指南

### 项目结构

```
src/
├── app/api/           # API路由
│   ├── auth/         # 认证相关
│   ├── posts/        # 文章管理
│   ├── comments/     # 评论系统
│   ├── search/       # 搜索功能
│   ├── upload/       # 文件上传
│   └── admin/        # 管理功能
├── lib/
│   ├── auth/         # 认证工具
│   ├── services/     # 业务逻辑服务
│   ├── utils/        # 工具函数
│   ├── db/           # 数据库配置
│   └── cache/        # 缓存服务
└── types/            # TypeScript类型定义
```

### 添加新API端点

1. 在 `src/app/api/` 下创建路由文件
2. 在 `src/lib/services/` 下创建服务类
3. 添加适当的认证和权限检查
4. 编写测试用例
5. 更新API文档

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint和Prettier规则
- 所有API返回统一格式
- 完整的错误处理
- 详细的日志记录

## 常见问题

### Q: 如何扩展到云存储？

A: 修改 `UploadService` 支持云存储提供商 (如 AWS S3, Cloudinary)。

### Q: 如何添加邮件通知？

A: 集成邮件服务 (如 Nodemailer + SMTP) 在评论和点赞时发送通知。

### Q: 如何处理大文件上传？

A: 实现分片上传和断点续传功能。

### Q: 如何添加全文搜索？

A: 集成 Elasticsearch 或 PostgreSQL 的全文搜索功能。

### Q: 如何实现实时通知？

A: 使用 WebSocket 或 Server-Sent Events (SSE)。
