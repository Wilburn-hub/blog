import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CategoryDetailPage } from '@/components/blog/category-detail-page'
import { CategoryService } from '@/lib/services/category.service'

interface CategoryPageProps {
  params: {
    slug: string
  }
  searchParams: {
    page?: string
    limit?: string
    sort?: string
  }
}

/**
 * 生成分类详情页面的metadata
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  try {
    const category = await CategoryService.getCategoryBySlug(params.slug)

    if (!category) {
      return {
        title: '分类不存在',
        description: '您访问的分类可能已被删除或不存在',
      }
    }

    return {
      title: `${category.name} - 分类`,
      description: category.description || `查看 ${category.name} 分类下的所有文章`,
      keywords: [category.name, '博客', '分类', '文章'],
      openGraph: {
        title: `${category.name} - 分类`,
        description: category.description || `查看 ${category.name} 分类下的所有文章`,
        type: 'website',
        url: `/categories/${category.slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${category.name} - 分类`,
        description: category.description || `查看 ${category.name} 分类下的所有文章`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata for category:', error)
    return {
      title: '分类详情',
      description: '查看分类下的所有文章',
    }
  }
}

/**
 * 分类详情页面
 * 支持SSG静态生成和客户端交互
 */
export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  try {
    // 解析查询参数
    const page = parseInt(searchParams.page || '1')
    const limit = parseInt(searchParams.limit || '10')
    const sort = (searchParams.sort as 'latest' | 'oldest' | 'popular' | 'views') || 'latest'

    // 验证参数
    if (page < 1 || limit < 1 || limit > 50) {
      throw new Error('Invalid pagination parameters')
    }

    // 获取分类信息和文章列表
    const result = await CategoryService.getCategoryPosts(params.slug, {
      page,
      limit,
      sort,
    })

    // 如果分类不存在，返回404
    if (!result.category) {
      notFound()
    }

    // 返回客户端组件，传递初始数据
    return (
      <CategoryDetailPage
        initialCategory={result.category}
        initialPosts={result.posts}
        initialPagination={result.pagination}
      />
    )
  } catch (error) {
    console.error('Error loading category page:', error)

    // 如果是参数错误或分类不存在，返回404
    if (error instanceof Error &&
        (error.message === 'Category not found' ||
         error.message === 'Invalid pagination parameters')) {
      notFound()
    }

    // 其他错误时返回空组件，让客户端组件处理
    return <CategoryDetailPage />
  }
}

/**
 * 生成静态参数
 * 为常用的分类生成静态页面
 */
export async function generateStaticParams() {
  try {
    // 获取热门分类，为它们生成静态页面
    const popularCategories = await CategoryService.getPopularCategories(10)

    return popularCategories.map((category: any) => ({
      slug: category.slug,
    }))
  } catch (error) {
    console.error('Error generating static params for categories:', error)
    return []
  }
}

/**
 * 页面重新验证时间（秒）
 * 分类页面内容更新频率不高，设置为1小时
 */
export const revalidate = 3600