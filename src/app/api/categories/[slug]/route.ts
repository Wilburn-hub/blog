import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)

    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = (searchParams.get('sort') as 'latest' | 'oldest' | 'popular' | 'views') || 'latest'

    // 验证参数
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // 获取分类信息和文章列表
    const result = await CategoryService.getCategoryPosts(slug, {
      page,
      limit,
      sort,
    })

    // 如果分类不存在，返回404
    if (!result.category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching category posts:', error)

    if (error instanceof Error && error.message === 'Category not found') {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}