'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ArrowRight,
  X,
  FileText,
  Tag,
  BookOpen,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PostCard } from '@/components/blog/post-card'
import { LoadingSkeleton, PostCardSkeleton } from '@/components/ui/loading-skeleton'
import { PostWithRelations, CategoryWithPosts } from '@/types'

// Mock search data
const mockSearchResults: PostWithRelations[] = [
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
]

const mockSuggestions = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  '性能优化',
  '前端工程化',
  'Vite',
  'Webpack',
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<PostWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'relevance' | 'latest' | 'popular'>('relevance')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    // Filter suggestions based on current query
    if (query && !hasSearched) {
      const filtered = mockSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [query, hasSearched])

  const performSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setShowSuggestions(false)
    setHasSearched(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))

      // Mock search results
      const filteredResults = mockSearchResults.filter(
        post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    performSearch(suggestion)
  }

  const handleClearSearch = () => {
    setQuery('')
    setSearchResults([])
    setHasSearched(false)
    setSelectedCategory('')
    setSortBy('relevance')
    searchInputRef.current?.focus()
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="rounded bg-yellow-200 px-1 dark:bg-yellow-800">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Search Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">搜索文章</h1>
          <p className="text-lg text-muted-foreground">在博客中查找您感兴趣的内容</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="搜索文章、标签、作者..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => !hasSearched && setShowSuggestions(true)}
                  className="pl-10 pr-10"
                />
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>

              {/* Search Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="rounded-md border bg-background shadow-lg">
                  <div className="p-2">
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="flex w-full items-center space-x-2 rounded-sm px-3 py-2 text-left transition-colors hover:bg-muted"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span>{highlightText(suggestion, query)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">所有分类</SelectItem>
                      {mockCategories.map(category => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name} ({category._count?.posts || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="排序方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">相关性</SelectItem>
                      <SelectItem value="latest">最新发布</SelectItem>
                      <SelectItem value="popular">最多阅读</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading || !query.trim()}>
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      搜索中...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      搜索
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Search Results */}
        {hasSearched && (
          <div>
            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">搜索结果 ({searchResults.length})</h2>
                    <p className="text-muted-foreground">
                      为 "{query}" 找到 {searchResults.length} 个结果
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleClearSearch}>
                    <X className="mr-2 h-4 w-4" />
                    清除搜索
                  </Button>
                </div>

                {/* Results List */}
                <div className="space-y-6">
                  {searchResults.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Load More */}
                <div className="mt-8 text-center">
                  <Button variant="outline">
                    加载更多
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* No Results */
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">未找到相关内容</h3>
                <p className="mb-6 text-muted-foreground">没有找到与 "{query}" 相关的文章</p>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">建议：</div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => performSearch('Next.js')}>
                      Next.js
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => performSearch('React')}>
                      React
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => performSearch('TypeScript')}>
                      TypeScript
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => performSearch('前端开发')}>
                      前端开发
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={handleClearSearch}>
                    开始新的搜索
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Popular Searches */}
        {!hasSearched && (
          <div className="space-y-8">
            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="mr-2 h-5 w-5" />
                  热门标签
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockSuggestions.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                      onClick={() => performSearch(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  热门分类
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockCategories.map(category => (
                    <div
                      key={category.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                      onClick={() => {
                        setQuery(category.name)
                        performSearch(category.name)
                      }}
                    >
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary">{category._count?.posts || 0} 篇</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Search Tips */}
            <Card>
              <CardHeader>
                <CardTitle>搜索技巧</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">使用关键词</p>
                    <p className="text-sm text-muted-foreground">输入相关技术名词、概念或问题</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">使用筛选器</p>
                    <p className="text-sm text-muted-foreground">通过分类和排序来精确查找内容</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="font-medium">查看热门内容</p>
                    <p className="text-sm text-muted-foreground">
                      点击热门标签和分类快速发现感兴趣的内容
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
