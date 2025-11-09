# 标签功能文档

本文档介绍了博客系统中完整的标签功能实现，包括API路由、页面组件、UI组件和服务层扩展。

## 功能概览

### 核心功能
- 🏷️ **标签管理**: 创建、查看、搜索和组织标签
- ☁️ **标签云**: 可视化展示标签，支持不同大小和颜色
- 🔍 **标签搜索**: 实时搜索和过滤标签
- 📊 **标签统计**: 详细的标签使用统计信息
- 🔗 **标签关联**: 显示相关标签推荐
- 📱 **响应式设计**: 支持移动端和桌面端

### SEO优化
- ✅ 动态生成meta标签
- ✅ 结构化数据支持
- ✅ 友好的URL结构
- ✅ 语义化HTML标签
- ✅ 面包屑导航支持

## 文件结构

```
src/
├── app/
│   ├── api/
│   │   └── tags/
│   │       └── route.ts                 # 标签API路由
│   └── tags/
│       ├── page.tsx                     # 标签列表页面
│       └── [tag]/
│           └── page.tsx                 # 标签详情页面
├── components/
│   ├── ui/
│   │   ├── tag-pill.tsx                 # 标签药丸组件
│   │   ├── tag-cloud.tsx                # 标签云组件
│   │   └── tag-search.tsx               # 标签搜索组件
│   ├── pages/
│   │   └── tag-detail-page.tsx          # 标签详情页面组件
│   └── blog/
│       └── post-tags.tsx                # 文章标签组件
├── lib/services/
│   └── post.service.ts                  # 扩展的PostService
└── types/
    └── index.ts                         # 标签相关类型定义
```

## API接口

### GET /api/tags

获取所有标签，支持搜索和排序。

**查询参数:**
- `q` (string): 搜索关键词
- `sort` (string): 排序方式 (name, count, recent)
- `order` (string): 排序顺序 (asc, desc)
- `page` (number): 页码
- `limit` (number): 每页数量

**响应示例:**
```json
{
  "tags": [
    {
      "name": "React",
      "count": 15,
      "slug": "react",
      "weight": 0.8,
      "size": "xl"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "pages": 2
  },
  "stats": {
    "totalTags": 100,
    "totalPosts": 500,
    "averagePostsPerTag": 5.0
  }
}
```

### GET /api/posts/tags/[tag]

获取指定标签的文章列表。

**查询参数:**
- `page` (number): 页码
- `limit` (number): 每页数量

## 组件使用指南

### TagPill - 标签药丸组件

用于显示单个标签的基础组件。

```tsx
import { TagPill } from '@/components/ui/tag-pill'

<TagPill
  tag={{ name: 'React', count: 15 }}
  variant="default"
  showCount={true}
  clickable={true}
  onClick={(tag) => console.log(tag)}
/>
```

**Props:**
- `tag` (Tag): 标签对象
- `variant` ('default' | 'small' | 'large'): 显示样式
- `showCount` (boolean): 是否显示文章数量
- `clickable` (boolean): 是否可点击
- `onClick` (function): 点击回调

### TagCloud - 标签云组件

显示标签云的可视化组件。

```tsx
import { TagCloud } from '@/components/ui/tag-cloud'

<TagCloud
  initialTags={tags}
  maxTags={50}
  showSearch={true}
  showStats={true}
  onTagClick={(tag) => navigate(`/tags/${tag}`)}
/>
```

**Props:**
- `initialTags` (TagCloudItem[]): 初始标签数据
- `maxTags` (number): 最大显示数量
- `showSearch` (boolean): 是否显示搜索框
- `showStats` (boolean): 是否显示统计信息
- `onTagClick` (function): 标签点击回调

### TagSearch - 标签搜索组件

提供实时搜索功能的组件。

```tsx
import { TagSearch } from '@/components/ui/tag-search'

<TagSearch
  placeholder="搜索标签..."
  maxResults={10}
  excludeTags={['existing-tag']}
  onTagSelect={(tag) => console.log(tag)}
/>
```

### PostTags - 文章标签组件

在文章中显示标签的复合组件。

```tsx
import { PostTags } from '@/components/blog/post-tags'

<PostTags
  tags={['React', 'JavaScript', 'TypeScript']}
  variant="pill"
  maxTags={5}
  showCount={true}
/>
```

## PostService扩展方法

### 新增的方法

1. **getTagDetails(tag, page, limit)** - 获取标签详细信息
2. **getRelatedTags(tag, limit)** - 获取相关标签
3. **searchTags(query, limit)** - 搜索标签
4. **getPopularTags(days, limit)** - 获取热门标签
5. **getTagStatistics()** - 获取标签统计信息
6. **cleanupUnusedTags()** - 清理未使用的标签

### 使用示例

```tsx
import { PostService } from '@/lib/services/post.service'

// 获取标签详情
const tagDetails = await PostService.getTagDetails('react', 1, 12)

// 搜索标签
const searchResults = await PostService.searchTags('react')

// 获取热门标签
const popularTags = await PostService.getPopularTags(30, 15)
```

## 页面路由

### /tags - 标签列表页面

显示所有标签的标签云页面，包含：
- 标签云可视化
- 搜索和过滤功能
- 热门标签排行
- 标签统计信息

### /tags/[tag] - 标签详情页面

显示特定标签的文章列表，包含：
- 标签信息展示
- 分页文章列表
- 相关标签推荐
- SEO优化的元数据

## 类型定义

```typescript
interface Tag {
  name: string
  count: number
  slug?: string
}

interface TagCloudItem extends Tag {
  size: 'sm' | 'md' | 'lg' | 'xl'
  weight: number
}

interface TagWithPosts extends Tag {
  posts: PostWithAuthor[]
  pagination?: PaginationInfo
}

interface TagStats {
  totalTags: number
  totalPosts: number
  averagePostsPerTag: number
  mostPopularTag: Tag
  recentTags: Tag[]
}
```

## 性能优化

### 缓存策略
- Redis缓存标签数据（1小时）
- 页面级静态生成（SSG）
- 客户端组件缓存

### 懒加载
- 标签云组件支持懒加载
- 搜索结果防抖处理
- 分页数据按需加载

### 数据库优化
- 标签查询索引优化
- 批量数据处理
- 查询结果限制

## SEO最佳实践

### 元数据优化
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${tagName} - 博客标签`,
    description: `浏览标签 "${tagName}" 下的文章`,
    keywords: [tagName, '博客', '文章', '标签'],
    openGraph: {
      title: `${tagName} - 博客标签`,
      description: `浏览标签 "${tagName}" 下的文章`,
      url: `/tags/${tag}`,
    }
  }
}
```

### URL结构
- 简洁友好的URL格式
- 自动处理特殊字符编码
- 支持中文标签

### 结构化数据
- JSON-LD格式的结构化数据
- 面包屑导航支持
- 文章列表语义化标记

## 样式定制

### 主题支持
- 明暗主题自动适配
- CSS变量自定义颜色
- 响应式断点配置

### 自定义样式
```css
/* 自定义标签颜色 */
.tag-pill {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300;
}

/* 标签云字体大小 */
.tag-cloud-size-xl {
  @apply text-xl font-bold;
}
```

## 测试建议

### 单元测试
- 标签组件渲染测试
- API接口响应测试
- 工具函数测试

### 集成测试
- 页面路由测试
- 搜索功能测试
- 分页功能测试

### E2E测试
- 标签点击跳转
- 搜索交互流程
- 响应式布局测试

## 故障排除

### 常见问题

1. **标签显示乱码**
   - 检查URL编码/解码
   - 确认数据库字符集设置

2. **搜索无结果**
   - 检查API接口响应
   - 验证搜索关键词格式

3. **分页不工作**
   - 确认分页参数传递
   - 检查后端分页逻辑

4. **缓存问题**
   - 清除Redis缓存
   - 检查缓存键命名规则

## 更新日志

### v1.0.0 (当前版本)
- ✅ 完整的标签功能实现
- ✅ API接口和页面组件
- ✅ SEO优化和性能优化
- ✅ 响应式设计和主题支持

### 计划功能
- 🔄 标签管理后台
- 🔄 标签导入/导出
- 🔄 标签合并功能
- 🔄 标签使用分析