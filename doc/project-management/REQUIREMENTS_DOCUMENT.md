# 个人博客网站需求文档

## 📋 项目概述

### 项目名称
个人博客网站 (Personal Blog)

### 技术栈
- **前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + Shadcn/ui
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: PostgreSQL + Redis (缓存)
- **部署**: Docker + Docker Compose

### 当前状态
✅ **已完成**: 基础架构、UI设计、核心页面布局
⚠️ **待实现**: 交互功能、API端点、数据内容、用户体验优化

---

## 🚫 **缺失功能详细需求**

### 1. 页面和路由需求

#### 1.1 基础页面 (高优先级)
- **`/categories`** - 分类页面
  - 显示所有文章分类
  - 分类统计信息
  - 分类下的文章列表
  - 分页功能

- **`/tags`** - 标签页面
  - 显示所有标签云
  - 标签使用频率统计
  - 标签关联文章列表
  - 搜索标签功能

- **`/about`** - 关于页面
  - 个人介绍
  - 技能展示
  - 联系方式
  - 社交媒体链接

#### 1.2 用户相关页面 (中优先级)
- **`/settings`** - 用户设置页面
  - 个人资料编辑
  - 密码修改
  - 邮箱设置
  - 偏好设置

- **`/favorites`** - 收藏页面
  - 收藏文章列表
  - 收藏分类管理
  - 收藏搜索功能

- **`/notifications`** - 通知页面
  - 系统通知
  - 评论通知
  - 点赞通知
  - 通知设置

#### 1.3 管理页面 (低优先级)
- **`/admin`** - 管理员页面
  - 文章管理
  - 用户管理
  - 评论管理
  - 系统设置

### 2. API端点需求

#### 2.1 认证API (高优先级)
```typescript
// POST /api/auth/signin
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// POST /api/auth/signup
interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  username: string;
}

// POST /api/auth/logout
interface LogoutRequest {
  refreshToken: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}
```

#### 2.2 搜索API (高优先级)
```typescript
// GET /api/search?q=keyword&type=posts&category=tech&tag=react
interface SearchRequest {
  q: string;
  type?: 'posts' | 'users' | 'tags';
  category?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

interface SearchResponse {
  results: SearchResult[];
  pagination: PaginationInfo;
  suggestions?: string[];
}
```

#### 2.3 文件上传API (中优先级)
```typescript
// POST /api/upload
interface UploadRequest {
  file: File;
  type: 'avatar' | 'cover' | 'attachment';
}

interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}
```

#### 2.4 评论API (中优先级)
```typescript
// POST /api/comments
interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
}

// GET /api/comments?postId=xxx
interface GetCommentsRequest {
  postId: string;
  page?: number;
  limit?: number;
}
```

### 3. 交互功能需求

#### 3.1 用户认证交互 (高优先级)
- **登录功能**
  - 邮箱/用户名登录
  - 密码显示/隐藏
  - 记住登录状态
  - 登录状态持久化
  - 自动登录功能

- **注册功能**
  - 邮箱验证
  - 密码强度检查
  - 用户名唯一性验证
  - 验证码功能

- **密码管理**
  - 忘记密码流程
  - 密码重置邮件
  - 密码修改功能

#### 3.2 文章交互功能 (高优先级)
- **点赞功能**
  - 文章点赞/取消点赞
  - 点赞数实时更新
  - 点赞状态持久化

- **收藏功能**
  - 文章收藏/取消收藏
  - 收藏列表管理
  - 收藏分类功能

- **分享功能**
  - 社交媒体分享
  - 复制链接功能
  - 生成分享海报

- **订阅功能**
  - RSS订阅
  - 邮件订阅
  - 推送通知

#### 3.3 评论系统 (中优先级)
- **评论功能**
  - 发表评论
  - 嵌套回复
  - 评论编辑
  - 评论删除
  - 评论举报

- **评论交互**
  - 评论点赞
  - 评论排序
  - 评论搜索
  - 评论分页

#### 3.4 搜索功能 (中优先级)
- **搜索交互**
  - 实时搜索建议
  - 搜索历史记录
  - 热门搜索推荐
  - 搜索结果高亮

- **高级搜索**
  - 多条件筛选
  - 日期范围筛选
  - 作者筛选
  - 分类筛选

### 4. 数据需求

#### 4.1 基础数据 (高优先级)
```sql
-- 需要填充的种子数据
INSERT INTO categories (name, slug, description, color) VALUES
('Web开发', 'web-development', '前端和后端Web开发技术', '#3B82F6'),
('React', 'react', 'React框架相关内容', '#06B6D4'),
('TypeScript', 'typescript', 'TypeScript语言特性和应用', '#3B82F6'),
('工具', 'tools', '开发工具和效率提升', '#10B981'),
('生活', 'life', '日常生活和感悟', '#F59E0B');

INSERT INTO tags (name, slug) VALUES
('Next.js', 'nextjs'),
('React', 'react'),
('TypeScript', 'typescript'),
('Tailwind CSS', 'tailwindcss'),
('Node.js', 'nodejs'),
('JavaScript', 'javascript'),
('CSS', 'css'),
('HTML', 'html');

-- 示例文章数据
INSERT INTO posts (title, slug, content, excerpt, published, featured, authorId) VALUES
('Next.js 14 完整开发指南：从入门到精通', 'nextjs-14-complete-guide', '详细的Next.js 14教程内容...', '深入解析Next.js 14的新特性，包括App Router、Server Components等', true, true, 'admin-user-id'),
('TypeScript 5.0 新特性详解', 'typescript-5-0-features', 'TypeScript 5.0新特性介绍...', '全面介绍TypeScript 5.0的新功能，包括装饰器、const类型参数等', true, true, 'admin-user-id');
```

#### 4.2 用户数据 (中优先级)
- 管理员账户
- 测试用户账户
- 用户权限设置
- 用户偏好数据

### 5. UI/UX改进需求

#### 5.1 组件功能 (中优先级)
- **搜索组件**
  - 实时搜索输入
  - 搜索建议下拉
  - 搜索历史显示

- **主题切换**
  - 主题状态持久化
  - 系统主题检测
  - 平滑过渡动画

- **导航菜单**
  - 移动端菜单展开
  - 菜单项高亮
  - 面包屑导航

#### 5.2 页面状态 (中优先级)
- **加载状态**
  - 骨架屏加载
  - 进度条显示
  - 加载动画

- **错误状态**
  - 404错误页面
  - 500错误页面
  - 网络错误提示

- **空状态**
  - 无文章提示
  - 搜索无结果
  - 评论为空提示

### 6. 性能优化需求

#### 6.1 图片优化 (中优先级)
- 图片懒加载
- 响应式图片
- 图片压缩
- WebP格式支持

#### 6.2 缓存优化 (低优先级)
- Redis缓存修复
- 页面缓存策略
- API响应缓存
- 静态资源缓存

#### 6.3 SEO优化 (低优先级)
- Meta标签完善
- 结构化数据
- Sitemap生成
- Robots.txt配置

---

## 🎯 开发优先级规划

### Phase 1: 核心功能 (1-2周)
1. ✅ 项目基础架构
2. 🔥 **用户认证系统** (登录/注册API)
3. 🔥 **基础页面创建** (/categories, /tags, /about)
4. 🔥 **搜索API修复**
5. 🔥 **数据库种子数据填充**

### Phase 2: 交互功能 (2-3周)
1. 🔶 **文章点赞/收藏功能**
2. 🔶 **评论系统实现**
3. 🔶 **文件上传功能**
4. 🔶 **用户个人中心**
5. 🔶 **移动端适配优化**

### Phase 3: 高级功能 (3-4周)
1. 🔵 **高级搜索功能**
2. 🔵 **管理后台功能**
3. 🔵 **性能优化**
4. 🔵 **SEO优化**
5. 🔵 **监控和分析**

---

## 🛠️ 技术要求

### 代码质量
- TypeScript严格模式
- ESLint + Prettier
- 单元测试覆盖率 > 80%
- E2E测试覆盖核心流程

### 性能指标
- 首页加载时间 < 2秒
- API响应时间 < 500ms
- 图片优化 > 80%
- Lighthouse评分 > 90

### 安全要求
- JWT认证安全
- SQL注入防护
- XSS攻击防护
- 文件上传安全
- HTTPS强制使用

---

## 📊 验收标准

### 功能验收
- [ ] 用户可以注册和登录
- [ ] 可以浏览、搜索文章
- [ ] 可以发表和管理评论
- [ ] 可以点赞和收藏文章
- [ ] 管理员可以管理内容

### 性能验收
- [ ] 页面加载速度达标
- [ ] API响应时间达标
- [ ] 移动端体验良好
- [ ] 无明显bug和错误

### 用户体验验收
- [ ] 界面美观现代
- [ ] 交互流畅自然
- [ ] 错误提示友好
- [ ] 支持暗黑模式

---

## 📝 备注

- 本需求文档基于当前代码库分析得出
- 优先级可根据实际需求调整
- 建议采用敏捷开发方式，按阶段交付
- 所有功能都需要相应的测试覆盖

**文档版本**: v1.0
**创建时间**: 2024-11-09
**最后更新**: 2024-11-09