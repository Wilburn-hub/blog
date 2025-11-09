import { NextRequest, NextResponse } from 'next/server'
import { RSSService } from '@/lib/services/rss.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // 获取查询参数
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const category = searchParams.get('category') || undefined
    const tag = searchParams.get('tag') || undefined
    const author = searchParams.get('author') || undefined
    const featured = searchParams.get('featured') === 'true'

    // 记录访问
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const params = new URLSearchParams(searchParams).toString()
    await RSSService.recordAccess('json', params, ip)

    // 生成JSON Feed
    const jsonFeed = await RSSService.generateJSONFeed({
      type: 'json',
      limit,
      category,
      tag,
      author,
      featured
    })

    // 返回响应
    return NextResponse.json(jsonFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // 30分钟缓存
        'X-JSON-Feed': 'Personal Blog JSON Feed',
        'X-JSON-Feed-Version': '1.1',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('JSON Feed生成错误:', error)

    // 返回错误响应
    const errorFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: 'JSON Feed 生成错误',
      description: 'JSON Feed暂时无法生成，请稍后再试',
      home_page_url: process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000',
      feed_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}/feed.json`,
      user_comment: '此Feed生成失败，请稍后再试',
      author: {
        name: '博客管理员',
        url: process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
      },
      expired: true,
      items: [{
        id: 'error',
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}/error`,
        title: 'JSON Feed 错误',
        content_text: `JSON Feed生成失败，请稍后再试。错误信息: ${error instanceof Error ? error.message : '未知错误'}`,
        date_published: new Date().toISOString(),
        author: {
          name: '系统',
          url: process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
        },
        tags: ['error', 'feed']
      }]
    }

    return NextResponse.json(errorFeed, {
      status: 500,
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
  }
}

// 支持HEAD请求以检查Feed是否可用
export async function HEAD(request: NextRequest) {
  try {
    // 检查RSS配置是否启用
    const config = await RSSService.getConfig()

    if (!config.enabled) {
      return new NextResponse(null, { status: 404 })
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/feed+json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800',
        'X-JSON-Feed': 'Personal Blog JSON Feed',
        'X-JSON-Feed-Version': '1.1',
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}

// OPTIONS请求支持CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}