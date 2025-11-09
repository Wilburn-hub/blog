import { NextRequest, NextResponse } from 'next/server'
import { RSSService } from '@/lib/services/rss.service'

// 获取RSS分析数据
export async function GET() {
  try {
    const analytics = await RSSService.getAnalytics()

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('获取RSS分析数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取RSS分析数据失败'
      },
      { status: 500 }
    )
  }
}

// 验证RSS Feed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    if (!type || !['rss', 'json'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: '请指定有效的Feed类型 (rss 或 json)'
        },
        { status: 400 }
      )
    }

    const validation = await RSSService.validateFeed(type as 'rss' | 'json')

    return NextResponse.json({
      success: true,
      data: validation,
      message: validation.valid ? 'Feed验证通过' : 'Feed验证失败'
    })
  } catch (error) {
    console.error('RSS Feed验证失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'RSS Feed验证失败'
      },
      { status: 500 }
    )
  }
}