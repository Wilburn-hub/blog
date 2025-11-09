import { NextRequest, NextResponse } from 'next/server'
import { PostService } from '@/lib/services/post.service'
import { Tag, TagSearchParams, TagStats } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 解析查询参数
    const params: TagSearchParams = {
      q: searchParams.get('q') || undefined,
      sort: (searchParams.get('sort') as 'name' | 'count' | 'recent') || 'count',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    // 获取所有标签
    const allTags = await PostService.getAllTags()

    // 应用搜索过滤
    let filteredTags = allTags
    if (params.q) {
      const query = params.q.toLowerCase()
      filteredTags = allTags.filter((tag: Tag) =>
        tag.name.toLowerCase().includes(query)
      )
    }

    // 应用排序
    filteredTags.sort((a: Tag, b: Tag) => {
      let comparison = 0

      switch (params.sort) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'count':
          comparison = b.count - a.count
          break
        case 'recent':
          // 对于recent排序，我们需要获取每个标签的最新文章时间
          // 这里暂时使用count作为替代，实际项目中可以优化
          comparison = b.count - a.count
          break
        default:
          comparison = b.count - a.count
      }

      return params.order === 'asc' ? comparison : -comparison
    })

    // 分页处理
    const startIndex = (params.page! - 1) * params.limit!
    const endIndex = startIndex + params.limit!
    const paginatedTags = filteredTags.slice(startIndex, endIndex)

    // 生成标签云数据（包含字体大小权重）
    const maxCount = Math.max(...allTags.map((t: Tag) => t.count))
    const minCount = Math.min(...allTags.map((t: Tag) => t.count))
    const range = maxCount - minCount || 1

    const tagsWithWeights = paginatedTags.map((tag: Tag) => {
      // 计算权重 (0-1)
      const weight = (tag.count - minCount) / range

      // 根据权重确定字体大小
      let size: 'sm' | 'md' | 'lg' | 'xl' = 'md'
      if (weight > 0.8) size = 'xl'
      else if (weight > 0.6) size = 'lg'
      else if (weight > 0.3) size = 'md'
      else size = 'sm'

      return {
        ...tag,
        slug: encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-')),
        weight,
        size,
      }
    })

    // 计算统计信息
    const totalPosts = allTags.reduce((sum: number, tag: Tag) => sum + tag.count, 0)
    const stats: TagStats = {
      totalTags: allTags.length,
      totalPosts,
      averagePostsPerTag: Math.round(totalPosts / allTags.length * 100) / 100,
      mostPopularTag: allTags[0] || { name: '', count: 0 },
      recentTags: allTags.slice(0, 10),
    }

    return NextResponse.json({
      tags: tagsWithWeights,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: filteredTags.length,
        pages: Math.ceil(filteredTags.length / params.limit!),
      },
      stats,
      meta: {
        query: params.q,
        sort: params.sort,
        order: params.order,
        hasMore: endIndex < filteredTags.length,
      }
    })

  } catch (error) {
    console.error('Error fetching tags:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch tags',
        message: error instanceof Error ? error.message : 'Unknown error',
        tags: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0,
        },
        stats: {
          totalTags: 0,
          totalPosts: 0,
          averagePostsPerTag: 0,
          mostPopularTag: { name: '', count: 0 },
          recentTags: [],
        }
      },
      { status: 500 }
    )
  }
}

// 支持HEAD请求用于检查API可用性
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}