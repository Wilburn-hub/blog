'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Folder, FileText, ChevronRight, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CategoryService } from '@/lib/services/category.service'
import { CategoryWithPostCount } from '@/lib/services/category.service'

interface CategorySidebarProps {
  title?: string
  limit?: number
  showPostCount?: boolean
  showIcon?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * 分类侧边栏组件
 * 显示热门分类，支持客户端数据获取
 */
export function CategorySidebar({
  title = '热门分类',
  limit = 10,
  showPostCount = true,
  showIcon = true,
  variant = 'default',
  className,
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<CategoryWithPostCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取热门分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)

        const popularCategories = await CategoryService.getPopularCategories(limit)
        setCategories(popularCategories)
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        setError('加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [limit])

  // 如果正在加载，显示骨架屏
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Folder className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-8 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 如果发生错误，显示错误信息
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Folder className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 如果没有分类，显示空状态
  if (categories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Folder className="mr-2 h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Folder className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">暂无分类</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center">
            <Folder className="mr-2 h-5 w-5" />
            {title}
          </div>
          <Link href="/categories">
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs">
              查看全部
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className={cn(
                'group flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50',
                variant === 'compact' && 'p-1'
              )}
            >
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {/* 分类图标 */}
                {showIcon && (
                  <div className="flex-shrink-0">
                    {category.icon ? (
                      <span
                        className={cn(
                          'text-sm',
                          category.color ? 'text-primary' : 'text-muted-foreground',
                          variant === 'compact' ? 'text-xs' : 'text-sm'
                        )}
                      >
                        {category.icon}
                      </span>
                    ) : (
                      <Folder
                        className={cn(
                          'h-4 w-4',
                          category.color ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    )}
                  </div>
                )}

                {/* 分类名称 */}
                <span
                  className={cn(
                    'truncate transition-colors group-hover:text-primary',
                    variant === 'compact' ? 'text-sm' : 'text-sm font-medium'
                  )}
                >
                  {category.name}
                </span>

                {/* 热门标识 */}
                {index < 3 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'flex-shrink-0',
                      variant === 'compact' && 'h-4 px-1 text-[10px]'
                    )}
                  >
                    {index === 0 ? '🔥' : index === 1 ? '⭐' : '📈'}
                  </Badge>
                )}
              </div>

              {/* 文章数量 */}
              {showPostCount && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{category._count.posts}</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* 底部链接 */}
        <div className="mt-4 pt-4 border-t">
          <Link href="/categories">
            <Button variant="ghost" className="w-full justify-between">
              <span>浏览所有分类</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}