'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TagCloudItem } from '@/types'

interface TagPillProps {
  tag: TagCloudItem | { name: string; count?: number }
  variant?: 'default' | 'small' | 'large'
  showCount?: boolean
  clickable?: boolean
  className?: string
  href?: string
  onClick?: (tag: string) => void
}

export function TagPill({
  tag,
  variant = 'default',
  showCount = true,
  clickable = true,
  className,
  href,
  onClick,
}: TagPillProps) {
  const isCloudItem = 'size' in tag && 'weight' in tag
  const cloudItem = isCloudItem ? tag as TagCloudItem : null

  // 根据变体或云标签大小设置样式
  const getSizeClasses = () => {
    if (variant === 'small') {
      return 'text-xs px-2 py-1'
    }

    if (variant === 'large') {
      return 'text-base px-4 py-2'
    }

    // 对于云标签，使用预定义的大小
    if (cloudItem) {
      switch (cloudItem.size) {
        case 'sm':
          return 'text-xs px-2 py-1'
        case 'md':
          return 'text-sm px-3 py-1.5'
        case 'lg':
          return 'text-base px-3 py-1.5'
        case 'xl':
          return 'text-lg px-4 py-2'
        default:
          return 'text-sm px-3 py-1.5'
      }
    }

    return 'text-sm px-3 py-1.5'
  }

  const sizeClasses = getSizeClasses()
  const displayName = decodeURIComponent(tag.name)

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 transition-colors duration-200',
        'hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        clickable && 'cursor-pointer hover:scale-105',
        sizeClasses,
        className
      )}
      onClick={() => {
        if (onClick && clickable) {
          onClick(tag.name)
        }
      }}
    >
      <span className="font-medium">{displayName}</span>
      {showCount && tag.count !== undefined && (
        <span className="text-xs opacity-70">
          {tag.count}
        </span>
      )}
    </span>
  )

  if (!clickable) {
    return content
  }

  // 如果提供了href，使用Link；否则使用默认的标签页面链接
  const tagHref = href || `/tags/${encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'))}`

  return (
    <Link
      href={tagHref}
      className="inline-block"
      title={`${displayName} 标签 (${tag.count || 0} 篇文章)`}
    >
      {content}
    </Link>
  )
}

// 用于渲染标签列表的组件
interface TagListProps {
  tags: (TagCloudItem | { name: string; count?: number })[]
  variant?: 'default' | 'small' | 'large'
  showCount?: boolean
  clickable?: boolean
  className?: string
  maxTags?: number
  onTagClick?: (tag: string) => void
}

export function TagList({
  tags,
  variant = 'default',
  showCount = true,
  clickable = true,
  className,
  maxTags,
  onTagClick,
}: TagListProps) {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags

  if (displayTags.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        暂无标签
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayTags.map((tag, index) => (
        <TagPill
          key={`${tag.name}-${index}`}
          tag={tag}
          variant={variant}
          showCount={showCount}
          clickable={clickable}
          onClick={onTagClick}
        />
      ))}
      {maxTags && tags.length > maxTags && (
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
          +{tags.length - maxTags} 更多
        </span>
      )}
    </div>
  )
}