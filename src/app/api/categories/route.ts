import { NextRequest, NextResponse } from 'next/server'
import { CategoryService } from '@/lib/services/category.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 获取查询参数
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || undefined
    const sort = (searchParams.get('sort') as 'name' | 'createdAt' | 'postCount') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    const includeEmpty = searchParams.get('includeEmpty') === 'true'

    // 验证参数
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // 如果有搜索关键词，使用搜索功能
    if (search?.trim()) {
      const categories = await CategoryService.searchCategories(search.trim(), limit)
      return NextResponse.json({
        success: true,
        data: {
          categories,
          pagination: {
            page: 1,
            limit,
            total: categories.length,
            pages: 1,
          },
        },
      })
    }

    // 否则获取分类列表
    const result = await CategoryService.getCategories({
      page,
      limit,
      search,
      sort,
      sortOrder,
      includeEmpty,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, slug, description, color, icon } = body

    // 验证必填字段
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // 创建分类
    const category = await CategoryService.createCategory({
      name: name.trim(),
      slug: slug?.trim(),
      description: description?.trim(),
      color: color?.trim(),
      icon: icon?.trim(),
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Error creating category:', error)

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category with this name or slug already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}