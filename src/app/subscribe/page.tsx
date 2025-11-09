import { Metadata } from 'next'
import { RSSSubscribe } from '@/components/blog/rss-subscribe'

export const metadata: Metadata = {
  title: 'RSS订阅 - 我的博客',
  description: '订阅我们的RSS Feed，及时获取最新的文章更新',
  keywords: ['RSS', '订阅', 'Feed', '博客订阅'],
  openGraph: {
    title: 'RSS订阅 - 我的博客',
    description: '订阅我们的RSS Feed，及时获取最新的文章更新',
    type: 'website',
  },
}

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <RSSSubscribe />
      </div>
    </div>
  )
}