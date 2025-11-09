'use client'

import { useState, useEffect } from 'react'
import { TagCloudItem, TagSearchParams } from '@/types'
import { TagList } from './tag-pill'
import { cn } from '@/lib/utils'

interface TagCloudProps {
  initialTags?: TagCloudItem[]
  maxTags?: number
  showSearch?: boolean
  showStats?: boolean
  className?: string
  onTagClick?: (tag: string) => void
}

export function TagCloud({
  initialTags = [],
  maxTags = 50,
  showSearch = true,
  showStats = false,
  className,
  onTagClick,
}: TagCloudProps) {
  const [tags, setTags] = useState<TagCloudItem[]>(initialTags)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'recent'>('count')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [stats, setStats] = useState({
    totalTags: 0,
    totalPosts: 0,
    averagePostsPerTag: 0,
  })

  // 获取标签数据
  const fetchTags = async (params: Partial<TagSearchParams> = {}) => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()

      if (params.q) searchParams.set('q', params.q)
      if (params.sort) searchParams.set('sort', params.sort)
      if (params.order) searchParams.set('order', params.order)
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/tags?${searchParams.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }

      const data = await response.json()
      setTags(data.tags)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching tags:', error)
      // 使用初始标签作为备选
      if (initialTags.length > 0) {
        setTags(initialTags)
      }
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载
  useEffect(() => {
    if (initialTags.length === 0) {
      fetchTags()
    }
  }, [])

  // 搜索和排序变化时重新获取数据
  useEffect(() => {
    if (initialTags.length === 0) {
      fetchTags({
        q: searchQuery || undefined,
        sort: sortBy,
        order: sortOrder,
        limit: maxTags,
      })
    }
  }, [searchQuery, sortBy, sortOrder])

  // 处理标签点击
  const handleTagClick = (tagName: string) => {
    if (onTagClick) {
      onTagClick(tagName)
    }
  }

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTags({
      q: searchQuery || undefined,
      sort: sortBy,
      order: sortOrder,
      limit: maxTags,
    })
  }

  // 生成标签云的颜色类
  const getTagColorClass = (weight: number, size: string) => {
    // 根据权重和大小生成不同的颜色
    const colors = [
      'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
      'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
      'text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300',
      'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300',
      'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300',
    ]

    const colorIndex = Math.floor(weight * colors.length)
    return colors[colorIndex % colors.length]
  }

  if (loading && tags.length === 0) {
    return (
      <div className={cn('p-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="flex flex-wrap gap-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full"
                style={{ width: `${Math.random() * 80 + 60}px` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const displayTags = maxTags ? tags.slice(0, maxTags) : tags

  return (
    <div className={cn('space-y-6', className)}>
      {/* 搜索和过滤 */}
      {showSearch && (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              搜索
            </button>
          </form>

          {/* 排序选项 */}
          <div className="flex gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'count' | 'recent')}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="count">按文章数量</option>
              <option value="name">按名称</option>
              <option value="recent">按最近使用</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">降序</option>
              <option value="asc">升序</option>
            </select>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      {showStats && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTags}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                标签总数
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                文章总数
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.averagePostsPerTag}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                平均文章数
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 标签云 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          标签云
        </h3>

        {displayTags.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            {searchQuery ? '未找到匹配的标签' : '暂无标签'}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-center justify-center">
            {displayTags.map((tag, index) => (
              <span
                key={`${tag.name}-${index}`}
                className={cn(
                  'inline-block cursor-pointer transition-all duration-200 hover:scale-110',
                  getTagColorClass(tag.weight, tag.size),
                  // 根据大小设置字体粗细
                  tag.size === 'xl' && 'font-bold',
                  tag.size === 'lg' && 'font-semibold',
                  tag.size === 'md' && 'font-medium',
                  tag.size === 'sm' && 'font-normal'
                )}
                onClick={() => handleTagClick(tag.name)}
                title={`${tag.name} (${tag.count} 篇文章)`}
              >
                {decodeURIComponent(tag.name)}
              </span>
            ))}
          </div>
        )}

        {maxTags && tags.length > maxTags && (
          <div className="text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              显示 {maxTags} 个标签，共 {tags.length} 个
            </span>
          </div>
        )}
      </div>

      {/* 加载状态 */}
      {loading && tags.length > 0 && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          更新中...
        </div>
      )}
    </div>
  )
}