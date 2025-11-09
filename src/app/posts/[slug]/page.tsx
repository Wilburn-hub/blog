import { notFound } from 'next/navigation'
import Link from 'next/link'
import React from 'react'
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  User,
  ArrowLeft,
  Edit,
  Tag,
  BookOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CoverImage } from '@/components/ui/cover-image'
import { CommentForm } from '@/components/blog/comment-form'
import { CommentList } from '@/components/blog/comment-list'
import { PostWithRelations, CommentWithAuthor } from '@/types'

// Mock data - 在实际项目中这些数据会从API获取
const mockPost: PostWithRelations = {
  id: '1',
  title: 'Next.js 14 完整开发指南：从入门到精通',
  slug: 'nextjs-14-complete-guide',
  excerpt:
    '深入解析Next.js 14的新特性，包括App Router、Server Components、Turbopack等核心概念，助你成为Next.js专家。',
  content: `
# Next.js 14 完整开发指南：从入门到精通

## 引言

Next.js 14 是 React 全栈框架的最新版本，带来了许多令人兴奋的新特性和改进。本指南将带你深入了解 Next.js 14 的核心概念，从基础到高级应用。

## App Router 革命

### 什么是 App Router？

App Router 是 Next.js 13 引入的新路由系统，基于 React Server Components (RSC) 构建。它提供了更好的性能、更直观的文件结构，以及更强大的功能。

### 核心特性

1. **Server Components by Default**: 所有组件默认为服务器组件
2. **Nested Layouts**: 支持嵌套布局
3. **Streaming**: 支持流式渲染
4. **Suspense Boundaries**: 更好的加载状态管理

## Server Components 深入理解

### 工作原理

Server Components 在服务器上运行，可以直接访问数据库和文件系统，不会发送到客户端。

\`\`\`typescript
// 这是一个 Server Component
async function BlogPost({ id }: { id: string }) {
  const post = await db.post.findUnique({ where: { id } });

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
\`\`\`

### Client Components

当需要交互性时，使用 \`'use client'\` 指令：

\`\`\`typescript
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
\`\`\`

## Turbopack 构建系统

### 性能提升

Turbopack 是 Rust 编写的下一代打包工具，提供：

- **53% 更快的本地开发启动**
- **94% 更快的代码更新**
- **更好的内存使用**

### 使用方法

\`\`\`bash
npm run dev -- --turbo
\`\`\`

## 最佳实践

### 1. 组件架构

- 默认使用 Server Components
- 仅在需要交互性时使用 Client Components
- 保持组件的单一职责

### 2. 数据获取

使用 React 的 \`async/await\` 语法：

\`\`\`typescript
async function Page() {
  const data = await fetch('https://api.example.com/data');
  const posts = await data.json();

  return <PostList posts={posts} />;
}
\`\`\`

### 3. 路由组织

\`\`\`
app/
├── layout.tsx
├── page.tsx
├── about/
│   └── page.tsx
├── blog/
│   ├── layout.tsx
│   ├── page.tsx
│   └── [slug]/
│       └── page.tsx
└── api/
    └── posts/
        └── route.ts
\`\`\`

## 部署策略

### Vercel 部署

最简单的部署方式：

\`\`\`bash
npm run build
npm run start
\`\`\`

### 自托管部署

\`\`\`bash
next build
next start
\`\`\`

## 总结

Next.js 14 为现代 Web 开发提供了强大的工具和优秀的开发体验。通过掌握 App Router、Server Components 和 Turbopack，你可以构建高性能、可扩展的 React 应用。

继续探索 Next.js 的世界，你会发现更多令人惊喜的功能！
  `,
  coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=630&fit=crop',
  featured: true,
  published: true,
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  viewCount: 1250,
  authorId: '1',
  author: {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    username: 'zhangsan',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  categories: [
    {
      id: '1',
      name: 'Web开发',
      slug: 'web-development',
      description: 'Web开发相关技术和最佳实践',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'React',
      slug: 'react',
      description: 'React框架相关内容',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  comments: [],
  likes: [],
  _count: {
    views: 1250,
    likes: 45,
    comments: 12,
  },
}

const mockComments: CommentWithAuthor[] = [
  {
    id: '1',
    content: '非常详细的文章！App Router 的部分解释得很清楚，解决了我的很多疑惑。',
    postId: '1',
    authorId: '2',
    parentId: null,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    author: {
      id: '2',
      name: '李四',
      email: 'lisi@example.com',
      username: 'lisi',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    replies: [
      {
        id: '2',
        content: '同意！特别是 Server Components 的概念，之前一直没搞明白。',
        postId: '1',
        authorId: '1',
        parentId: '1',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        author: {
          id: '1',
          name: '张三',
          email: 'zhangsan@example.com',
          username: 'zhangsan',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        replies: [],
      },
    ],
  },
  {
    id: '3',
    content: '请问 Turbopack 在实际项目中使用体验如何？有没有遇到什么兼容性问题？',
    postId: '1',
    authorId: '3',
    parentId: null,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    author: {
      id: '3',
      name: '王五',
      email: 'wangwu@example.com',
      username: 'wangwu',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    replies: [],
  },
]

const mockRelatedPosts: PostWithRelations[] = [
  {
    id: '2',
    title: 'TypeScript 5.0 新特性详解与实践',
    slug: 'typescript-5-0-features',
    excerpt: '全面介绍TypeScript 5.0的新功能，包括装饰器、const类型参数等。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    viewCount: 980,
    authorId: '1',
    author: mockPost.author,
    categories: [
      {
        id: '3',
        name: 'TypeScript',
        slug: 'typescript',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    comments: [],
    likes: [],
    _count: {
      views: 980,
      likes: 32,
      comments: 8,
    },
  },
  {
    id: '3',
    title: 'Tailwind CSS 3.4 高级技巧与最佳实践',
    slug: 'tailwind-css-3-4-advanced-tips',
    excerpt: '分享Tailwind CSS 3.4的高级用法和实用技巧。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=225&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    viewCount: 650,
    authorId: '1',
    author: mockPost.author,
    categories: [
      {
        id: '4',
        name: 'CSS',
        slug: 'css',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    comments: [],
    likes: [],
    _count: {
      views: 650,
      likes: 28,
      comments: 6,
    },
  },
]

// Mock functions - 在实际项目中这些会是API调用
async function getPost(slug: string): Promise<PostWithRelations | null> {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 100))
  return slug === 'nextjs-14-complete-guide' ? mockPost : null
}

async function getComments(postId: string): Promise<CommentWithAuthor[]> {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockComments
}

async function getRelatedPosts(postId: string): Promise<PostWithRelations[]> {
  // 模拟API调用
  await new Promise(resolve => setTimeout(resolve, 100))
  return mockRelatedPosts
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    return {
      title: '文章未找到',
      description: '抱歉，您查找的文章不存在。',
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)

  if (!post) {
    notFound()
  }

  const [comments, relatedPosts] = await Promise.all([
    getComments(post.id),
    getRelatedPosts(post.id),
  ])

  const readingTime = Math.ceil(post.content.length / 1000) // 假设每分钟1000字

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/posts" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Link>
        </Button>

        {/* Article Header */}
        <article className="space-y-6">
          <header className="space-y-4">
            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {post.categories.map(category => (
                <Link key={category.id} href={`/categories/${category.slug}`}>
                  <Badge
                    variant="secondary"
                    className="transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <BookOpen className="mr-1 h-3 w-3" />
                    {category.name}
                  </Badge>
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            {/* Author and Meta */}
            <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={post.author.avatar || ''}
                    alt={post.author.name || post.author.email}
                  />
                  <AvatarFallback>
                    {(post.author.name || post.author.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{post.author.name || post.author.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(post.publishedAt || post.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime}分钟阅读</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post._count?.views || 0}阅读</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>{post._count?.likes || 0}点赞</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post._count?.comments || 0}评论</span>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl">
                <CoverImage
                  src={post.coverImage}
                  alt={post.title}
                  width={1200}
                  height={630}
                  priority
                />
              </div>
            )}
          </header>

          {/* Article Content */}
          <div className="blog-content prose prose-gray max-w-none dark:prose-invert">
            <div
              dangerouslySetInnerHTML={{
                __html: `
              ${post.content
                .replace(
                  /```(\w+)?\n([\s\S]*?)```/g,
                  '<pre class="bg-muted p-4 rounded-lg overflow-x-auto"><code class="text-sm">$2</code></pre>'
                )
                .replace(
                  /`([^`]+)`/g,
                  '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
                )
                .replace(/### (.*)/g, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>')
                .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
                .replace(/# (.*)/g, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
                .replace(/^/, '<p class="mb-4 leading-relaxed">')
                .replace(/$/, '</p>')
                .replace(/<p><\/p>/g, '')
                .replace(/<h([1-6])>/g, '<h$1 class="scroll-mt-20">')
                .replace(
                  /<blockquote>/g,
                  '<blockquote class="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">'
                )
                .replace(/<pre>/g, '<pre class="bg-muted rounded-lg p-4 overflow-x-auto"><code>')
                .replace(/<\/pre>/g, '</code></pre>')
                .replace(/<p>(```)/g, '$1')
                .replace(/(```)<\/p>/g, '$1')}
            `,
              }}
            />
          </div>

          {/* Article Footer */}
          <footer className="border-t pt-6">
            <div className="flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Tag className="mt-1 h-4 w-4 text-muted-foreground" />
                {['Next.js', 'React', 'Server Components', 'App Router', 'TypeScript'].map(tag => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              {/* Share and Actions */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  分享
                </Button>
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  点赞
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  收藏
                </Button>
              </div>
            </div>
          </footer>
        </article>

        <Separator className="my-12" />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">相关文章</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {relatedPosts.map(relatedPost => (
                <Card key={relatedPost.id} className="group transition-shadow hover:shadow-lg">
                  <Link href={`/posts/${relatedPost.slug}`}>
                    <CardHeader className="pb-3">
                      <div className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-lg">
                        {relatedPost.coverImage ? (
                          <CoverImage
                            src={relatedPost.coverImage}
                            alt={relatedPost.title}
                            width={400}
                            height={225}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <div className="text-2xl text-muted-foreground">📝</div>
                          </div>
                        )}
                      </div>
                      <h3 className="line-clamp-2 font-semibold transition-colors group-hover:text-primary">
                        {relatedPost.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {relatedPost.excerpt}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(
                            relatedPost.publishedAt || relatedPost.createdAt
                          ).toLocaleDateString('zh-CN')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span>{relatedPost._count?.views || 0}阅读</span>
                          <span>•</span>
                          <span>{relatedPost._count?.likes || 0}点赞</span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Comments Section */}
        <section>
          <h2 className="mb-6 text-2xl font-bold">评论 ({post._count?.comments || 0})</h2>

          {/* Comment Form */}
          <CommentForm
            postId={post.id}
            onSubmit={async () => {
              // Mock submit function
              console.log('Comment submitted')
            }}
            placeholder="写下你的评论..."
            user={post.author} // 模拟当前用户为文章作者
          />

          <Separator className="my-8" />

          {/* Comments List */}
          <CommentList
            comments={comments}
            postId={post.id}
            onCommentSubmit={async () => {
              console.log('Reply submitted')
            }}
            onCommentDelete={async () => {
              console.log('Comment deleted')
            }}
            onCommentLike={async () => {
              console.log('Comment liked')
            }}
            currentUser={post.author} // 模拟当前用户为文章作者
          />
        </section>
      </div>
    </div>
  )
}
