'use client'

import { TagPill, TagList, TagCloud, PopularTags } from '@/components/ui'
import { Tag, TagCloudItem } from '@/types'

interface PostTagsProps {
  tags: string[]
  variant?: 'default' | 'pill' | 'cloud' | 'popular'
  maxTags?: number
  showCount?: boolean
  className?: string
}

export function PostTags({
  tags,
  variant = 'default',
  maxTags,
  showCount = false,
  className,
}: PostTagsProps) {
  // 将标签数组转换为Tag对象数组
  const tagObjects: Tag[] = tags.map(tag => ({
    name: tag,
    count: 0, // 在文章详情页面，我们不显示计数
  }))

  // 转换为TagCloudItem（如果需要）
  const tagCloudItems: TagCloudItem[] = tagObjects.map(tag => ({
    ...tag,
    slug: encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-')),
    size: 'md' as const,
    weight: 0.5,
  }))

  const handleTagClick = (tagName: string) => {
    window.location.href = `/tags/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}`
  }

  switch (variant) {
    case 'pill':
      return (
        <TagList
          tags={tagObjects}
          showCount={showCount}
          maxTags={maxTags}
          className={className}
          onTagClick={handleTagClick}
        />
      )

    case 'cloud':
      return (
        <TagCloud
          initialTags={tagCloudItems}
          maxTags={maxTags}
          showSearch={false}
          showStats={false}
          className={className}
          onTagClick={handleTagClick}
        />
      )

    case 'popular':
      return (
        <PopularTags
          maxTags={maxTags || 10}
          onTagClick={handleTagClick}
          className={className}
        />
      )

    default:
      return (
        <div className={className}>
          {tagObjects.slice(0, maxTags).map((tag, index) => (
            <TagPill
              key={`${tag.name}-${index}`}
              tag={tag}
              showCount={showCount}
              onClick={handleTagClick}
            />
          ))}
        </div>
      )
  }
}

// 在文章列表中显示标签的组件
interface PostCardTagsProps {
  tags: string[]
  maxTags?: number
  className?: string
}

export function PostCardTags({ tags, maxTags = 3, className }: PostCardTagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = tags.slice(0, maxTags)
  const remainingCount = tags.length - maxTags

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayTags.map((tag, index) => (
        <a
          key={tag}
          href={`/tags/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`}
          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
          title={tag}
        >
          {decodeURIComponent(tag)}
        </a>
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

// 在侧边栏中显示标签云的组件
interface SidebarTagCloudProps {
  maxTags?: number
  title?: string
  className?: string
}

export function SidebarTagCloud({
  maxTags = 15,
  title = '标签云',
  className,
}: SidebarTagCloudProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <TagCloud
        maxTags={maxTags}
        showSearch={false}
        showStats={false}
        onTagClick={(tagName) => {
          window.location.href = `/tags/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}`
        }}
      />
    </div>
  )
}

// 在侧边栏中显示热门标签的组件
interface SidebarPopularTagsProps {
  maxTags?: number
  title?: string
  className?: string
}

export function SidebarPopularTags({
  maxTags = 10,
  title = '热门标签',
  className,
}: SidebarPopularTagsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <PopularTags
        maxTags={maxTags}
        onTagClick={(tagName) => {
          window.location.href = `/tags/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}`
        }}
      />
    </div>
  )
}