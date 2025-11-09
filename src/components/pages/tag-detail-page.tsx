'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { PostWithAuthor, TagWithPosts } from '@/types'
import { PostCard } from '@/components/blog/post-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { TagPill } from '@/components/ui/tag-pill'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TagDetailPageProps {
  tag: string
  initialData?: TagWithPosts
}

export function TagDetailPage({ tag, initialData }: TagDetailPageProps) {
  const [data, setData] = useState<TagWithPosts | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // 获取标签详情数据
  const fetchTagData = async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/tags/${encodeURIComponent(tag)}?page=${page}`)

      if (!response.ok) {
        if (response.status === 404) {
          notFound()
        }
        throw new Error('Failed to fetch tag data')
      }

      const tagData = await response.json()

      // 格式化数据以匹配TagWithPosts接口
      const formattedData: TagWithPosts = {
        name: tag,
        count: tagData.pagination?.total || 0,
        posts: tagData.posts || [],
        pagination: tagData.pagination,
      }

      setData(formattedData)
      setCurrentPage(page)
    } catch (err) {
      console.error('Error fetching tag data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载数据
  useEffect(() => {
    if (!initialData) {
      fetchTagData(1)
    }
  }, [tag])

  // 处理分页
  const handlePageChange = (page: number) => {
    fetchTagData(page)
  }

  // 处理标签点击
  const handleTagClick = (tagName: string) => {
    window.location.href = `/tags/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}`
  }

  // 格式化标签名称显示
  const formatTagName = (tagName: string) => {
    return decodeURIComponent(tagName).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">出错了</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => fetchTagData(1)}>重试</Button>
        </div>
      </div>
    )
  }

  if (!data) {
    return notFound()
  }

  const { posts, pagination } = data
  const formattedTagName = formatTagName(tag)

  return (
    <div className="min-h-screen">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              标签: {formattedTagName}
            </h1>
            <div className="flex items-center justify-center gap-4 text-lg">
              <span>共 {pagination?.total || 0} 篇文章</span>
              {data.count && <span>•</span>}
              <span>标签热度: {data.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 相关标签 */}
          {posts.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                相关标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {posts.slice(0, 5).flatMap(post => post.tags).slice(0, 10).map((tagName, index) => (
                  <TagPill
                    key={`${tagName}-${index}`}
                    tag={{ name: tagName }}
                    onClick={handleTagClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 文章列表 */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  暂无文章
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  这个标签下还没有文章，请稍后再来看看。
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    相关文章 ({pagination?.total || 0})
                  </h2>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    第 {currentPage} 页，共 {pagination?.pages || 0} 页
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* 分页导航 */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => {
                        // 显示当前页附近的页码
                        const showPage =
                          page === 1 ||
                          page === pagination.pages ||
                          Math.abs(page - currentPage) <= 2

                        if (!showPage) {
                          // 显示省略号
                          if (page === currentPage - 3 || page === currentPage + 3) {
                            return (
                              <span key={page} className="px-3 py-1 text-gray-500">
                                ...
                              </span>
                            )
                          }
                          return null
                        }

                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => handlePageChange(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= pagination.pages}
                      className="flex items-center gap-2"
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 返回顶部 */}
          {posts.length > 6 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                返回顶部
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}