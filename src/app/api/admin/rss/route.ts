import { NextRequest, NextResponse } from 'next/server'
import { RSSService } from '@/lib/services/rss.service'
import { RSSConfig } from '@/types'

// 获取RSS配置
export async function GET() {
  try {
    const config = await RSSService.getConfig()
    return NextResponse.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('获取RSS配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取RSS配置失败'
      },
      { status: 500 }
    )
  }
}

// 更新RSS配置
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<RSSConfig> = await request.json()

    // 验证配置
    const config = await RSSService.updateConfig(body)

    return NextResponse.json({
      success: true,
      data: config,
      message: 'RSS配置更新成功'
    })
  } catch (error) {
    console.error('更新RSS配置失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新RSS配置失败'
      },
      { status: 500 }
    )
  }
}

// 重置RSS配置为默认值
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'reset') {
      // 重置为默认配置
      const defaultConfig = {
        enabled: true,
        maxItems: 20,
        includeContent: true,
        contentLength: 500,
        includeAuthor: true,
        includeCategories: true,
        includeImages: true,
        cacheTTL: 1800,
        feedInfo: {
          title: '我的博客',
          description: '分享技术、生活和思考的博客',
          language: 'zh-cn'
        }
      }

      const config = await RSSService.updateConfig(defaultConfig)

      return NextResponse.json({
        success: true,
        data: config,
        message: 'RSS配置已重置为默认值'
      })
    }

    if (action === 'clear-cache') {
      // 清除RSS缓存
      await RSSService.clearRSSCache()

      return NextResponse.json({
        success: true,
        message: 'RSS缓存已清除'
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: '无效的操作'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('操作失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '操作失败'
      },
      { status: 500 }
    )
  }
}