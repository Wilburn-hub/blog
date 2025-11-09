'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Tag } from '@/types'
import { TagPill } from './tag-pill'
import { cn } from '@/lib/utils'

interface TagSearchProps {
  onTagSelect?: (tag: string) => void
  placeholder?: string
  maxResults?: number
  excludeTags?: string[]
  className?: string
}

export function TagSearch({
  onTagSelect,
  placeholder = '搜索标签...',
  maxResults = 10,
  excludeTags = [],
  className,
}: TagSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 搜索标签
  const searchTags = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/tags?q=${encodeURIComponent(searchQuery.trim())}&limit=${maxResults}`)
      if (response.ok) {
        const data = await response.json()
        // 过滤掉已排除的标签
        const filteredResults = data.tags.filter((tag: Tag) =>
          !excludeTags.includes(tag.name) && !selectedTags.includes(tag.name)
        )
        setResults(filteredResults)
        setIsOpen(filteredResults.length > 0)
      }
    } catch (error) {
      console.error('Error searching tags:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchTags(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, selectedTags])

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 处理标签选择
  const handleTagSelect = (tag: Tag) => {
    if (onTagSelect) {
      onTagSelect(tag.name)
    } else {
      // 如果没有提供回调，添加到已选标签
      setSelectedTags(prev => [...prev, tag.name])
    }
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  // 移除已选标签
  const removeSelectedTag = (tagName: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagName))
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* 已选标签 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map(tag => (
            <div key={tag} className="inline-flex items-center gap-1">
              <TagPill
                tag={{ name: tag }}
                clickable={false}
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
              />
              <button
                type="button"
                onClick={() => removeSelectedTag(tag)}
                className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* 搜索结果下拉框 */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {query.trim().length < 2 ? '输入至少2个字符进行搜索' : '未找到匹配的标签'}
            </div>
          ) : (
            <div className="p-2">
              {results.map((tag, index) => (
                <button
                  key={`${tag.name}-${index}`}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {decodeURIComponent(tag.name)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 搜索提示 */}
          {query.trim().length >= 2 && results.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                按 <kbd className="px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd> 关闭
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 用于快速选择热门标签的组件
interface PopularTagsProps {
  onTagSelect?: (tag: string) => void
  maxTags?: number
  className?: string
}

export function PopularTags({ onTagSelect, maxTags = 10, className }: PopularTagsProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularTags = async () => {
      try {
        const response = await fetch(`/api/tags?sort=count&order=desc&limit=${maxTags}`)
        if (response.ok) {
          const data = await response.json()
          setTags(data.tags.slice(0, maxTags))
        }
      } catch (error) {
        console.error('Error fetching popular tags:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularTags()
  }, [maxTags])

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          热门标签
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
              style={{ width: `${Math.random() * 60 + 40}px` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (tags.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        热门标签
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagPill
            key={tag.name}
            tag={tag}
            variant="small"
            onClick={() => onTagSelect?.(tag.name)}
          />
        ))}
      </div>
    </div>
  )
}