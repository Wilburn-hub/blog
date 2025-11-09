import Link from 'next/link'
import React from 'react'
import {
  BookOpen,
  TrendingUp,
  Calendar,
  User,
  ArrowRight,
  PenTool,
  Heart,
  MessageCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostCard } from '@/components/blog/post-card'
import { Sidebar } from '@/components/layout/sidebar'
import { PostWithRelations, CategoryWithPosts } from '@/types'

// Mock data - 在实际项目中这些数据会从API获取
const mockFeaturedPosts: PostWithRelations[] = [
  {
    id: '1',
    title: 'Next.js 14 完整开发指南：从入门到精通',
    slug: 'nextjs-14-complete-guide',
    excerpt:
      '深入解析Next.js 14的新特性，包括App Router、Server Components、Turbopack等核心概念，助你成为Next.js专家。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop',
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
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categories: [
      {
        id: '1',
        name: 'Web开发',
        slug: 'web-development',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'React',
        slug: 'react',
        description: '',
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
  },
  {
    id: '2',
    title: 'TypeScript 5.0 新特性详解与实践',
    slug: 'typescript-5-0-features',
    excerpt:
      '全面介绍TypeScript 5.0的新功能，包括装饰器、const类型参数、export type *等特性的实际应用。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop',
    featured: true,
    published: true,
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    viewCount: 980,
    authorId: '1',
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
]

const mockRecentPosts: PostWithRelations[] = [
  {
    id: '3',
    title: 'Tailwind CSS 3.4 高级技巧与最佳实践',
    slug: 'tailwind-css-3-4-advanced-tips',
    excerpt: '分享Tailwind CSS 3.4的高级用法，包括自定义插件、动画系统、响应式设计等实用技巧。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    viewCount: 650,
    authorId: '1',
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
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
  {
    id: '4',
    title: '构建高性能React应用：优化策略与实践',
    slug: 'react-performance-optimization',
    excerpt: '深入探讨React应用性能优化的各种策略，包括代码分割、懒加载、Memo化等技术的实际应用。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-18'),
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    viewCount: 820,
    authorId: '1',
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categories: [
      {
        id: '2',
        name: 'React',
        slug: 'react',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    comments: [],
    likes: [],
    _count: {
      views: 820,
      likes: 35,
      comments: 9,
    },
  },
  {
    id: '5',
    title: '现代前端开发工具链：Vite vs Webpack 2024对比',
    slug: 'vite-vs-webpack-2024',
    excerpt: '全面对比Vite和Webpack在2024年的表现，帮助你选择最适合项目的构建工具。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=800&h=450&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    viewCount: 720,
    authorId: '1',
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    categories: [
      {
        id: '5',
        name: '工具',
        slug: 'tools',
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    comments: [],
    likes: [],
    _count: {
      views: 720,
      likes: 24,
      comments: 7,
    },
  },
]

const mockCategories: CategoryWithPosts[] = [
  {
    id: '1',
    name: 'Web开发',
    slug: 'web-development',
    description: 'Web开发相关技术和最佳实践',
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    _count: { posts: 15 },
  },
  {
    id: '2',
    name: 'React',
    slug: 'react',
    description: 'React框架相关内容',
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    _count: { posts: 8 },
  },
  {
    id: '3',
    name: 'TypeScript',
    slug: 'typescript',
    description: 'TypeScript语言特性和应用',
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    _count: { posts: 6 },
  },
]

const mockTags = [
  { name: 'Next.js', count: 12 },
  { name: 'React', count: 8 },
  { name: 'TypeScript', count: 6 },
  { name: 'Tailwind CSS', count: 5 },
  { name: '性能优化', count: 4 },
  { name: '前端工程化', count: 7 },
]

export default function HomePage() {
  return (
    <div className="container px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main Content */}
        <div className="space-y-12 lg:col-span-3">
          {/* Hero Section */}
          <section className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 text-center md:py-20">
            <div className="mx-auto max-w-3xl">
              <Badge variant="outline" className="mb-4">
                <PenTool className="mr-2 h-4 w-4" />
                欢迎来到我的博客
              </Badge>
              <h1 className="mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold leading-tight text-transparent md:text-5xl lg:text-6xl">
                分享技术，记录成长
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                专注于前端开发、Web技术栈分享。在这里，你可以找到关于React、Next.js、TypeScript等技术的深度文章和实践经验。
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild className="px-8 text-base">
                  <Link href="/posts">
                    浏览文章
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-8 text-base">
                  <Link href="/about">关于我</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Featured Posts */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">精选文章</h2>
              <Button variant="ghost" asChild>
                <Link href="/posts?featured=true" className="text-primary">
                  查看全部
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {mockFeaturedPosts.map(post => (
                <PostCard key={post.id} post={post} variant="featured" />
              ))}
            </div>
          </section>

          {/* Recent Posts */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-bold md:text-3xl">最新文章</h2>
              <Button variant="ghost" asChild>
                <Link href="/posts" className="text-primary">
                  查看全部
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {mockRecentPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>

          {/* Stats Section */}
          <section className="rounded-2xl bg-muted/50 p-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">25+</div>
                <div className="text-sm text-muted-foreground">文章总数</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">15K+</div>
                <div className="text-sm text-muted-foreground">总阅读量</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">320+</div>
                <div className="text-sm text-muted-foreground">评论数</div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-primary md:text-3xl">180+</div>
                <div className="text-sm text-muted-foreground">点赞数</div>
              </div>
            </div>
          </section>

          {/* Topics Section */}
          <section>
            <h2 className="mb-8 text-2xl font-bold md:text-3xl">热门话题</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockCategories.map(category => (
                <Card
                  key={category.id}
                  className="group cursor-pointer transition-shadow hover:shadow-lg"
                >
                  <Link href={`/categories/${category.slug}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg transition-colors group-hover:text-primary">
                          {category.name}
                        </CardTitle>
                        <Badge variant="secondary">{category._count?.posts || 0}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Sidebar
              recentPosts={mockRecentPosts}
              categories={mockCategories}
              tags={mockTags}
              popularPosts={mockFeaturedPosts}
              showSearch={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
