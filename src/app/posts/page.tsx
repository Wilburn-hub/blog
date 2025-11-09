'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Grid, List, Calendar, TrendingUp, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { PostCard } from '@/components/blog/post-card'
import { LoadingSkeleton, PostCardSkeleton } from '@/components/ui/loading-skeleton'
import { PostWithRelations, CategoryWithPosts } from '@/types'

// Mock data - 在实际项目中这些数据会从API获取
const mockPosts: PostWithRelations[] = [
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
  {
    id: '4',
    name: 'CSS',
    slug: 'css',
    description: 'CSS样式和布局',
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    _count: { posts: 4 },
  },
  {
    id: '5',
    name: '工具',
    slug: 'tools',
    description: '开发工具和效率提升',
    createdAt: new Date(),
    updatedAt: new Date(),
    posts: [],
    _count: { posts: 7 },
  },
]

const mockTags = [
  { name: 'Next.js', count: 12 },
  { name: 'React', count: 8 },
  { name: 'TypeScript', count: 6 },
  { name: 'Tailwind CSS', count: 5 },
  { name: '性能优化', count: 4 },
  { name: '前端工程化', count: 7 },
  { name: 'Vite', count: 3 },
  { name: 'Webpack', count: 2 },
]

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'featured'>('latest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 9

  // 模拟数据加载
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPosts(mockPosts)
      setLoading(false)
    }

    loadPosts()
  }, [])

  // 过滤和排序文章
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        !selectedCategory || post.categories.some(cat => cat.slug === selectedCategory)
      const matchesTag = !selectedTag || true // 简化处理，实际应该检查标签
      const matchesSort = sortBy === 'featured' ? post.featured : true

      return matchesSearch && matchesCategory && matchesTag && matchesSort
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return (
            new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime()
          )
        case 'popular':
          return (b._count?.views || 0) - (a._count?.views || 0)
        case 'featured':
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
        default:
          return 0
      }
    })

  // 分页
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">文章列表</h1>
          <p className="text-lg text-muted-foreground">
            共 {filteredPosts.length} 篇文章，涵盖前端开发、技术分享等主题
          </p>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索文章..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                {/* Category Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[120px] justify-between">
                      {selectedCategory
                        ? mockCategories.find(cat => cat.slug === selectedCategory)?.name
                        : '所有分类'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem onClick={() => setSelectedCategory('')}>
                      所有分类
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {mockCategories.map(category => (
                      <DropdownMenuItem
                        key={category.id}
                        onClick={() => setSelectedCategory(category.slug)}
                      >
                        {category.name} ({category._count?.posts || 0})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[120px] justify-between">
                      {sortBy === 'latest' && '最新发布'}
                      {sortBy === 'popular' && '最多阅读'}
                      {sortBy === 'featured' && '精选文章'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortBy('latest')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      最新发布
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('popular')}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      最多阅读
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('featured')}>
                      <Filter className="mr-2 h-4 w-4" />
                      精选文章
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Mode */}
                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || selectedTag) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCategory && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory('')}
                  >
                    {mockCategories.find(cat => cat.slug === selectedCategory)?.name}×
                  </Badge>
                )}
                {selectedTag && (
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSelectedTag('')}
                  >
                    {selectedTag}×
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {mockTags.map(tag => (
              <Badge
                key={tag.name}
                variant={selectedTag === tag.name ? 'default' : 'outline'}
                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSelectedTag(selectedTag === tag.name ? '' : tag.name)}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Posts Grid/List */}
        <div className="mb-8">
          {loading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                  : 'space-y-6'
              }
            >
              {Array.from({ length: 6 }).map((_, i) =>
                viewMode === 'grid' ? <PostCardSkeleton key={i} /> : <CardSkeleton key={i} />
              )}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-lg text-muted-foreground">没有找到匹配的文章</div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('')
                  setSelectedTag('')
                  setSortBy('latest')
                }}
              >
                清除筛选条件
              </Button>
            </div>
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-6'
                }
              >
                {paginatedPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    variant={viewMode === 'grid' ? 'default' : 'compact'}
                    showExcerpt={viewMode === 'grid'}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
