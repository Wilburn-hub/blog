'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  FileText,
  Users,
  MessageCircle,
  Heart,
  Eye,
  TrendingUp,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { PostWithRelations } from '@/types'

// Mock data - 在实际项目中这些数据会从API获取
const mockStats = {
  totalPosts: 25,
  totalViews: 15678,
  totalComments: 342,
  totalLikes: 1289,
  recentViews: 1256,
  recentComments: 28,
  recentLikes: 67,
  totalUsers: 892,
}

const mockRecentPosts: PostWithRelations[] = [
  {
    id: '1',
    title: 'Next.js 14 完整开发指南：从入门到精通',
    slug: 'nextjs-14-complete-guide',
    excerpt: '深入解析Next.js 14的新特性，包括App Router、Server Components等。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=225&fit=crop',
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
      role: 'ADMIN',
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
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'ADMIN',
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

const mockPopularPosts: PostWithRelations[] = [
  {
    id: '3',
    title: '构建高性能React应用：优化策略与实践',
    slug: 'react-performance-optimization',
    excerpt: '深入探讨React应用性能优化的各种策略。',
    content: '',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    featured: false,
    published: true,
    publishedAt: new Date('2024-01-18'),
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    viewCount: 1820,
    authorId: '1',
    author: {
      id: '1',
      name: '张三',
      email: 'zhangsan@example.com',
      username: 'zhangsan',
      role: 'ADMIN',
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
      views: 1820,
      likes: 89,
      comments: 34,
    },
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(mockStats)
  const [recentPosts, setRecentPosts] = useState<PostWithRelations[]>([])
  const [popularPosts, setPopularPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setRecentPosts(mockRecentPosts)
      setPopularPosts(mockPopularPosts)
      setLoading(false)
    }

    loadData()
  }, [])

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    description,
  }: {
    title: string
    value: string | number
    change?: { value: number; type: 'increase' | 'decrease' }
    icon: React.ElementType
    description: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <TrendingUp
              className={`h-3 w-3 ${change.type === 'increase' ? 'text-green-500' : 'text-red-500'}`}
            />
            <span className={change.type === 'increase' ? 'text-green-500' : 'text-red-500'}>
              {change.type === 'increase' ? '+' : ''}
              {change.value}%
            </span>
            <span>vs 上周</span>
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">仪表板</h1>
            <p className="text-muted-foreground">欢迎回来，这里是您的博客数据中心</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/posts/create">
              <Plus className="mr-2 h-4 w-4" />
              写新文章
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="总文章数"
            value={stats.totalPosts}
            change={{ value: 12, type: 'increase' }}
            icon={FileText}
            description="已发布的文章总数"
          />
          <StatCard
            title="总阅读量"
            value={stats.totalViews.toLocaleString()}
            change={{ value: 8, type: 'increase' }}
            icon={Eye}
            description="所有文章的总阅读次数"
          />
          <StatCard
            title="评论数"
            value={stats.totalComments}
            change={{ value: 15, type: 'increase' }}
            icon={MessageCircle}
            description="用户评论总数"
          />
          <StatCard
            title="点赞数"
            value={stats.totalLikes}
            change={{ value: 5, type: 'increase' }}
            icon={Heart}
            description="文章获得的点赞总数"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Recent Posts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最新文章</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/posts">
                    查看全部
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <CardDescription>最近发布的文章</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
                      <div className="mb-1 h-3 w-1/2 rounded bg-muted"></div>
                      <div className="h-3 w-1/3 rounded bg-muted"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPosts.map(post => (
                    <div
                      key={post.id}
                      className="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                          <h4 className="truncate font-medium">
                            <Link
                              href={`/posts/${post.slug}`}
                              className="transition-colors hover:text-primary"
                            >
                              {post.title}
                            </Link>
                          </h4>
                          {post.featured && (
                            <Badge variant="secondary" className="text-xs">
                              精选
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                              'zh-CN'
                            )}
                          </span>
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            {post._count?.views || 0}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="mr-1 h-3 w-3" />
                            {post._count?.comments || 0}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/posts/edit/${post.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Posts */}
          <Card>
            <CardHeader>
              <CardTitle>热门文章</CardTitle>
              <CardDescription>阅读量最高的文章</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="mb-2 h-4 w-3/4 rounded bg-muted"></div>
                      <div className="mb-1 h-3 w-1/2 rounded bg-muted"></div>
                      <div className="h-3 w-1/3 rounded bg-muted"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <div
                      key={post.id}
                      className="flex items-start space-x-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="mb-1 truncate font-medium">
                          <Link
                            href={`/posts/${post.slug}`}
                            className="transition-colors hover:text-primary"
                          >
                            {post.title}
                          </Link>
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            {post._count?.views || 0}
                          </span>
                          <span className="flex items-center">
                            <Heart className="mr-1 h-3 w-3" />
                            {post._count?.likes || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快捷入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col space-y-2 p-4" asChild>
                <Link href="/dashboard/posts/create">
                  <Plus className="h-6 w-6" />
                  <span>写新文章</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col space-y-2 p-4" asChild>
                <Link href="/dashboard/posts">
                  <FileText className="h-6 w-6" />
                  <span>管理文章</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col space-y-2 p-4" asChild>
                <Link href="/dashboard/comments">
                  <MessageCircle className="h-6 w-6" />
                  <span>评论管理</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto flex-col space-y-2 p-4" asChild>
                <Link href="/dashboard/analytics">
                  <BarChart3 className="h-6 w-6" />
                  <span>数据分析</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
