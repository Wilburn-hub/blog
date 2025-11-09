'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Folder, Calendar, Grid3X3, List, ArrowLeft, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { PostCard } from './post-card'
import { CategoryBreadcrumb } from './category-breadcrumb'
import { cn } from '@/lib/utils'
import { CategoryService, CategoryQueryOptions } from '@/lib/services/category.service'
import { CategoryWithPostCount } from '@/lib/services/category.service'
import { PostWithRelations } from '@/types'

interface CategoryDetailPageProps {
  initialCategory?: CategoryWithPostCount
  initialPosts?: PostWithRelations[]
  initialPagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/**
 * 分类详情页面组件
 * 展示分类信息和相关文章列表，支持分页和排序
 */
export function CategoryDetailPage({
  initialCategory,
  initialPosts,
  initialPagination,
}: CategoryDetailPageProps) {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  // 状态管理
  const [category, setCategory] = useState<CategoryWithPostCount | null>(initialCategory || null)
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts || [])
  const [pagination, setPagination] = useState(initialPagination || { page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'popular' | 'views'>('latest')

  // 获取分类详情和文章列表
  const fetchCategoryData = async (page = 1, sort = 'latest') => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      const result = await CategoryService.getCategoryPosts(slug, {
        page,
        limit: pagination.limit,
        sort,
      })

      setCategory(result.category)
      setPosts(result.posts)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Failed to fetch category data:', err)
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.pages) return
    fetchCategoryData(page, sortBy)
  }

  // 处理排序变化
  const handleSortChange = (value: string) => {
    const sort = value as typeof sortBy
    setSortBy(sort)
    fetchCategoryData(1, sort)
  }

  // 首次加载或参数变化时重新获取数据
  useEffect(() => {
    if (!initialCategory || !initialPosts) {
      fetchCategoryData(1, sortBy)
    }
  }, [slug])

  // 如果正在加载，显示骨架屏
  if (loading && !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CategoryDetailSkeleton />
      </div>
    )
  }

  // 如果发生错误，显示错误信息
  if (error && !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">加载失败</h1>
          <p className="mb-8 text-muted-foreground">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
        </div>
      </div>
    )
  }

  // 如果分类不存在
  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">分类不存在</h1>
          <p className="mb-8 text-muted-foreground">您访问的分类可能已被删除或不存在</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <div className="mb-6">
        <CategoryBreadcrumb
          categoryName={category.name}
          categorySlug={category.slug}
        />
      </div>

      {/* 分类头部信息 */}
      <div className="mb-8">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {/* 分类图标 */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-lg p-3',
                  category.color ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                {category.icon ? (
                  <span
                    className={cn(
                      'text-2xl',
                      category.color ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {category.icon}
                  </span>
                ) : (
                  <Folder
                    className={cn(
                      'h-8 w-8',
                      category.color ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                )}
              </div>

              {/* 分类信息 */}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold">{category.name}</h1>
                {category.description && (
                  <p className="mb-4 text-lg text-muted-foreground">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>创建于 {new Date(category.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <Badge variant="secondary">
                    {category._count.posts} 篇文章
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选和排序栏 */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">排序方式:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">最新发布</SelectItem>
                <SelectItem value="oldest">最早发布</SelectItem>
                <SelectItem value="popular">最受欢迎</SelectItem>
                <SelectItem value="views">浏览最多</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">显示方式:</span>
            <div className="flex rounded-md border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none border-l"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="mb-8">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: pagination.limit }).map((_, index) => (
              <div key={index}>
                <LoadingSkeleton className="h-64" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div
            className={cn(
              'grid gap-6',
              viewMode === 'grid' && 'md:grid-cols-2 lg:grid-cols-3',
              viewMode === 'list' && 'max-w-4xl mx-auto'
            )}
          >
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                variant={viewMode === 'list' ? 'default' : 'default'}
                showAuthor={true}
                showExcerpt={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无文章</h3>
            <p className="text-muted-foreground">该分类下还没有发布任何文章</p>
          </div>
        )}
      </div>

      {/* 分页控件 */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            上一页
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: pagination.pages }, (_, index) => {
              const page = index + 1
              const isCurrentPage = page === pagination.page
              const isNearCurrentPage = Math.abs(page - pagination.page) <= 2
              const isFirstOrLast = page === 1 || page === pagination.pages

              if (isCurrentPage || isNearCurrentPage || isFirstOrLast) {
                return (
                  <Button
                    key={page}
                    variant={isCurrentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="h-8 w-8 p-0"
                  >
                    {page}
                  </Button>
                )
              }

              if (page === pagination.page - 3 || page === pagination.page + 3) {
                return (
                  <span key={page} className="px-2 text-muted-foreground">
                    ...
                  </span>
                )
              }

              return null
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-8 pt-8 border-t">
        <div className="text-center text-sm text-muted-foreground">
          共 {pagination.total} 篇文章，第 {pagination.page} 页，共 {pagination.pages} 页
        </div>
      </div>
    </div>
  )
}

/**
 * 分类详情页面骨架屏
 */
function CategoryDetailSkeleton() {
  return (
    <>
      {/* 返回按钮骨架 */}
      <div className="mb-6">
        <LoadingSkeleton className="h-9 w-20" />
      </div>

      {/* 分类信息骨架 */}
      <div className="mb-8 rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <LoadingSkeleton className="h-20 w-20 rounded-lg" />
          <div className="flex-1 space-y-3">
            <LoadingSkeleton className="h-8 w-64" />
            <LoadingSkeleton className="h-5 w-96" />
            <LoadingSkeleton className="h-5 w-48" />
          </div>
        </div>
      </div>

      {/* 筛选栏骨架 */}
      <div className="mb-6 flex justify-between">
        <div className="flex items-center space-x-2">
          <LoadingSkeleton className="h-9 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <LoadingSkeleton className="h-9 w-24" />
        </div>
      </div>

      {/* 文章列表骨架 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <LoadingSkeleton className="h-64" />
          </div>
        ))}
      </div>
    </>
  )
}