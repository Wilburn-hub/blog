import Link from 'next/link'
import React from 'react'
import { Folder, FileText, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CategoryWithPostCount } from '@/lib/services/category.service'

interface CategoryCardProps {
  category: CategoryWithPostCount
  variant?: 'default' | 'compact' | 'featured'
  showDescription?: boolean
  showPostCount?: boolean
  className?: string
}

/**
 * 分类卡片组件
 * 用于展示分类信息，支持多种显示样式
 */
export function CategoryCard({
  category,
  variant = 'default',
  showDescription = true,
  showPostCount = true,
  className,
}: CategoryCardProps) {
  const isCompact = variant === 'compact'
  const isFeatured = variant === 'featured'

  return (
    <Card
      className={cn(
        'group overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/50',
        isFeatured && 'md:col-span-2 border-primary/20 bg-primary/5',
        isCompact && 'p-4',
        className
      )}
    >
      <CardContent className={cn('p-6', isCompact && 'p-0')}>
        {/* 分类头部 */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* 分类图标 */}
            <div
              className={cn(
                'flex items-center justify-center rounded-lg p-2',
                isCompact ? 'h-8 w-8 p-1.5' : 'h-12 w-12',
                category.color ? 'bg-primary/10' : 'bg-muted'
              )}
            >
              {category.icon ? (
                <span
                  className={cn(
                    isCompact ? 'text-sm' : 'text-lg',
                    category.color ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {category.icon}
                </span>
              ) : (
                <Folder
                  className={cn(
                    isCompact ? 'h-4 w-4' : 'h-6 w-6',
                    category.color ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              )}
            </div>

            {/* 分类信息 */}
            <div className="flex-1 min-w-0">
              {/* 分类名称 */}
              <Link href={`/categories/${category.slug}`}>
                <h3
                  className={cn(
                    'font-bold transition-colors group-hover:text-primary line-clamp-1',
                    isFeatured ? 'text-xl md:text-2xl' : 'text-lg',
                    isCompact && 'text-base'
                  )}
                >
                  {category.name}
                </h3>
              </Link>

              {/* 分类描述 */}
              {showDescription && !isCompact && category.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          {/* 文章数量标签 */}
          {showPostCount && (
            <Badge
              variant={isFeatured ? 'default' : 'secondary'}
              className="shrink-0"
            >
              <FileText className="mr-1 h-3 w-3" />
              {category._count.posts}
            </Badge>
          )}
        </div>

        {/* 精选分类的额外信息 */}
        {isFeatured && category.description && (
          <p className="mt-4 text-muted-foreground line-clamp-3">
            {category.description}
          </p>
        )}
      </CardContent>

      {/* 卡片底部 */}
      {!isCompact && (
        <CardFooter className="px-6 pb-6 pt-0">
          <Link href={`/categories/${category.slug}`} className="w-full">
            <Button
              variant="ghost"
              className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground"
            >
              <span>查看文章</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </CardFooter>
      )}

      {/* 紧凑模式的链接 */}
      {isCompact && (
        <div className="flex items-center justify-between mt-3">
          {showDescription && category.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1 mr-3">
              {category.description}
            </p>
          )}
          <Link href={`/categories/${category.slug}`}>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}