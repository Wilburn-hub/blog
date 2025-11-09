import { Metadata } from 'next'
import Link from 'next/link'
import { Folder, FileText, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryCard } from '@/components/blog/category-card'
import { CategoryService } from '@/lib/services/category.service'
import { SearchCategoriesClient } from '@/components/blog/search-categories-client'

/**
 * 生成分类列表页面的metadata
 */
export const metadata: Metadata = {
  title: '分类列表 - 博客',
  description: '浏览所有文章分类，找到您感兴趣的内容',
  keywords: ['分类', '博客', '文章', '标签'],
  openGraph: {
    title: '分类列表 - 博客',
    description: '浏览所有文章分类，找到您感兴趣的内容',
    type: 'website',
    url: '/categories',
  },
}

/**
 * 分类列表页面
 * 展示所有分类，支持搜索和筛选
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: {
    search?: string
    page?: string
    limit?: string
    sort?: string
  }
}) {
  try {
    // 解析查询参数
    const search = searchParams.search || ''
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '20')
    const sort = (searchParams.sort as 'name' | 'createdAt' | 'postCount') || 'postCount'

    // 验证参数
    if (page < 1 || limit < 1 || limit > 50) {
      throw new Error('Invalid parameters')
    }

    let categories: Awaited<ReturnType<typeof CategoryService.getCategories>>['categories']
    let total = 0
    let pages = 1

    // 如果有搜索关键词，使用搜索功能
    if (search.trim()) {
      const searchResults = await CategoryService.searchCategories(search, limit)
      categories = searchResults
      total = searchResults.length
      pages = Math.ceil(total / limit)
    } else {
      // 否则获取所有分类
      const result = await CategoryService.getCategories({
        page,
        limit,
        sort,
        sortOrder: 'desc',
        includeEmpty: false, // 不显示空分类
      })
      categories = result.categories
      total = result.pagination.total
      pages = result.pagination.pages
    }

    // 获取分类统计信息
    const stats = await CategoryService.getCategoryStats()

    return (
      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold">文章分类</h1>
          <p className="text-lg text-muted-foreground">
            浏览所有文章分类，找到您感兴趣的内容
          </p>
        </div>

        {/* 统计信息 */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalCategories}</div>
            <div className="text-sm text-muted-foreground">总分类数</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.categoriesWithPosts}</div>
            <div className="text-sm text-muted-foreground">有文章的分类</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPostsInCategories}</div>
            <div className="text-sm text-muted-foreground">分类下文章总数</div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avgPostsPerCategory}</div>
            <div className="text-sm text-muted-foreground">平均每分类文章数</div>
          </div>
        </div>

        {/* 搜索栏 */}
        <div className="mb-8">
          <SearchCategoriesClient initialSearch={search} />
        </div>

        {/* 分类列表 */}
        {categories.length > 0 ? (
          <>
            <div className="mb-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* 热门分类 - 第一位显示为精选 */}
              {categories.map((category: any, index: number) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  variant={index === 0 && !search ? 'featured' : 'default'}
                  showDescription={true}
                  showPostCount={true}
                />
              ))}
            </div>

            {/* 分页控件 - 仅在非搜索模式下显示 */}
            {!search && pages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <Link href={`/categories?page=${Math.max(1, page - 1)}&sort=${sort}&limit=${limit}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                  >
                    上一页
                  </Button>
                </Link>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: pages }, (_, index) => {
                    const currentPage = index + 1
                    const isCurrentPage = currentPage === page
                    const isNearCurrentPage = Math.abs(currentPage - page) <= 2
                    const isFirstOrLast = currentPage === 1 || currentPage === pages

                    if (isCurrentPage || isNearCurrentPage || isFirstOrLast) {
                      return (
                        <Link
                          key={currentPage}
                          href={`/categories?page=${currentPage}&sort=${sort}&limit=${limit}`}
                        >
                          <Button
                            variant={isCurrentPage ? 'default' : 'outline'}
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            {currentPage}
                          </Button>
                        </Link>
                      )
                    }

                    if (currentPage === page - 3 || currentPage === page + 3) {
                      return (
                        <span key={currentPage} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      )
                    }

                    return null
                  })}
                </div>

                <Link href={`/categories?page=${Math.min(pages, page + 1)}&sort=${sort}&limit=${limit}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pages}
                  >
                    下一页
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {search ? '未找到相关分类' : '暂无分类'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? `没有找到包含 "${search}" 的分类，请尝试其他关键词`
                : '还没有创建任何分类'
              }
            </p>
            {search && (
              <Link href="/categories">
                <Button variant="outline">
                  查看所有分类
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* 底部信息 */}
        {categories.length > 0 && (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            {search
              ? `找到 ${categories.length} 个相关分类`
              : `第 ${page} 页，共 ${pages} 页，显示 ${categories.length} 个分类`
            }
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Error loading categories page:', error)

    // 发生错误时显示错误页面
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">加载失败</h1>
          <p className="mb-8 text-muted-foreground">
            无法加载分类列表，请稍后重试
          </p>
          <Link href="/">
            <Button variant="outline">
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    )
  }
}

/**
 * 页面重新验证时间（秒）
 * 分类列表页面更新频率不高，设置为30分钟
 */
export const revalidate = 1800