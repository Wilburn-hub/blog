import React from 'react'
import Link from 'next/link'
import { ChevronRight, Home, Folder } from 'lucide-react'

import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface CategoryBreadcrumbProps {
  categoryName: string
  categorySlug: string
  additionalItems?: BreadcrumbItem[]
  className?: string
}

/**
 * 分类面包屑导航组件
 * 显示从首页到当前分类的导航路径
 */
export function CategoryBreadcrumb({
  categoryName,
  categorySlug,
  additionalItems = [],
  className,
}: CategoryBreadcrumbProps) {
  // 构建面包屑项目
  const breadcrumbItems: BreadcrumbItem[] = [
    {
      label: '首页',
      href: '/',
      icon: <Home className="h-4 w-4" />,
    },
    {
      label: '分类',
      href: '/categories',
      icon: <Folder className="h-4 w-4" />,
    },
    {
      label: categoryName,
      href: `/categories/${categorySlug}`,
    },
    ...additionalItems,
  ]

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1
        const hasIcon = !!item.icon

        return (
          <React.Fragment key={index}>
            {/* 面包屑项目 */}
            <div className="flex items-center">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="flex items-center space-x-1 transition-colors hover:text-foreground"
                >
                  {hasIcon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className="flex items-center space-x-1">
                  {hasIcon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className={cn(isLast && 'text-foreground font-medium')}>
                    {item.label}
                  </span>
                </div>
              )}
            </div>

            {/* 分隔符 */}
            {!isLast && (
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}