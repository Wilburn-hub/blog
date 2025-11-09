'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchCategoriesClientProps {
  initialSearch?: string
}

/**
 * 分类搜索客户端组件
 * 处理分类搜索功能，支持防抖和URL参数同步
 */
export function SearchCategoriesClient({ initialSearch = '' }: SearchCategoriesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [isSearching, setIsSearching] = useState(false)

  // 防抖函数
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== initialSearch) {
        performSearch(searchTerm)
      }
    }, 300) // 300ms 防抖

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // 执行搜索
  const performSearch = (term: string) => {
    setIsSearching(true)

    // 构建新的URL参数
    const params = new URLSearchParams(searchParams.toString())

    if (term.trim()) {
      params.set('search', term.trim())
      // 重置页码到第一页
      params.delete('page')
    } else {
      params.delete('search')
    }

    // 更新URL
    router.push(`/categories?${params.toString()}`, { scroll: false })

    // 模拟搜索延迟，提供更好的用户体验
    setTimeout(() => {
      setIsSearching(false)
    }, 200)
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchTerm)
    }
  }

  // 清除搜索
  const handleClear = () => {
    setSearchTerm('')
    performSearch('')
  }

  return (
    <div className="relative max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="搜索分类..."
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-10"
          disabled={isSearching}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
            disabled={isSearching}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">清除搜索</span>
          </Button>
        )}
      </div>

      {/* 搜索状态指示器 */}
      {isSearching && (
        <div className="absolute inset-y-0 right-10 flex items-center pr-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
        </div>
      )}
    </div>
  )
}