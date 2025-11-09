import { Metadata } from 'next'
import { TagCloud } from '@/components/ui/tag-cloud'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tag, TagCloudItem, TagStats } from '@/types'

// 获取标签数据
async function getTagsData() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tags?limit=100`, {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // 1小时缓存
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching tags data:', error)
    return {
      tags: [],
      stats: {
        totalTags: 0,
        totalPosts: 0,
        averagePostsPerTag: 0,
        mostPopularTag: { name: '', count: 0 },
        recentTags: [],
      },
    }
  }
}

// 生成页面元数据
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '所有标签 - 博客',
    description: '浏览博客的所有标签，通过标签快速找到感兴趣的文章内容。',
    keywords: ['标签', '博客', '分类', '文章标签'],
    openGraph: {
      title: '所有标签 - 博客',
      description: '浏览博客的所有标签，通过标签快速找到感兴趣的文章内容。',
      type: 'website',
      url: '/tags',
    },
    twitter: {
      card: 'summary',
      title: '所有标签 - 博客',
      description: '浏览博客的所有标签，通过标签快速找到感兴趣的文章内容。',
    },
    alternates: {
      canonical: '/tags',
    },
  }
}

// 热门标签卡片组件
function PopularTagsCard({ tags }: { tags: Tag[] }) {
  const topTags = tags.slice(0, 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🔥</span>
          热门标签
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topTags.map((tag, index) => (
            <div key={tag.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-6">
                  {index + 1}
                </span>
                <a
                  href={`/tags/${encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'))}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  {decodeURIComponent(tag.name)}
                </a>
              </div>
              <Badge variant="secondary" className="text-xs">
                {tag.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 统计信息卡片组件
function StatsCard({ stats }: { stats: TagStats }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📊</span>
          标签统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalTags}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              标签总数
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.totalPosts}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              文章总数
            </div>
          </div>
          <div className="text-center col-span-2">
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {stats.averagePostsPerTag}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              平均文章数/标签
            </div>
          </div>
        </div>

        {stats.mostPopularTag && stats.mostPopularTag.name && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              最热门标签
            </div>
            <a
              href={`/tags/${encodeURIComponent(stats.mostPopularTag.name.toLowerCase().replace(/\s+/g, '-'))}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {decodeURIComponent(stats.mostPopularTag.name)}
              <Badge variant="secondary" className="text-xs">
                {stats.mostPopularTag.count}
              </Badge>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 最近使用标签卡片组件
function RecentTagsCard({ tags }: { tags: Tag[] }) {
  const recentTags = tags.slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🕒</span>
          最近使用
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {recentTags.map((tag) => (
            <a
              key={tag.name}
              href={`/tags/${encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'))}`}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              {decodeURIComponent(tag.name)}
              <span className="text-xs opacity-70">{tag.count}</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// 页面组件
export default async function TagsPage() {
  const data = await getTagsData()
  const { tags, stats } = data

  // 转换为TagCloudItem格式
  const tagCloudItems: TagCloudItem[] = tags.map((tag: Tag) => ({
    ...tag,
    slug: encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-')),
    size: tag.count > 20 ? 'xl' : tag.count > 10 ? 'lg' : tag.count > 5 ? 'md' : 'sm',
    weight: Math.min(tag.count / 20, 1),
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              所有标签
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              通过标签快速找到感兴趣的文章内容。点击标签查看相关文章，或使用搜索功能找到特定的标签。
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-4">
            {/* 主要内容区域 - 标签云 */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <TagCloud
                  initialTags={tagCloudItems}
                  showSearch={true}
                  showStats={false}
                  maxTags={100}
                  onTagClick={(tagName) => {
                    window.location.href = `/tags/${encodeURIComponent(tagName.toLowerCase().replace(/\s+/g, '-'))}`
                  }}
                />
              </div>
            </div>

            {/* 侧边栏 */}
            <div className="space-y-6">
              {/* 统计信息 */}
              <StatsCard stats={stats} />

              {/* 热门标签 */}
              <PopularTagsCard tags={tags} />

              {/* 最近使用 */}
              <RecentTagsCard tags={stats.recentTags} />
            </div>
          </div>

          {/* 页面底部信息 */}
          <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              共 {stats.totalTags} 个标签，{stats.totalPosts} 篇文章
            </p>
            <p className="mt-2">
              标签帮助您更好地组织和浏览博客内容
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 设置重新验证时间（5分钟）
export const revalidate = 300