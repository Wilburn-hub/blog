'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { RSSButton } from '@/components/ui/rss-button'
import { Card } from '@/components/ui/card'

interface RSSSubscribeProps {
  className?: string
}

export function RSSSubscribe({ className }: RSSSubscribeProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
  const rssUrl = `${baseUrl}/rss`
  const jsonUrl = `${baseUrl}/feed.json`

  const copyToClipboard = async (url: string, type: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(type)
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const popularReaders = [
    {
      name: 'Feedly',
      url: 'https://feedly.com',
      description: '现代化的RSS阅读器，支持多平台',
      color: 'bg-green-500'
    },
    {
      name: 'Inoreader',
      url: 'https://www.inoreader.com',
      description: '功能强大的RSS阅读器，支持高级搜索',
      color: 'bg-blue-500'
    },
    {
      name: 'Feedbin',
      url: 'https://feedbin.com',
      description: '简洁优雅的RSS阅读服务',
      color: 'bg-yellow-500'
    },
    {
      name: 'The Old Reader',
      url: 'https://theoldreader.com',
      description: '类似Google Reader的经典阅读器',
      color: 'bg-purple-500'
    }
  ]

  const appReaders = [
    {
      name: 'Reeder 5',
      platform: 'iOS/macOS',
      description: '设计精美的原生应用',
      icon: '📱'
    },
    {
      name: 'FeedMe',
      platform: 'Android',
      description: '功能丰富的Android RSS阅读器',
      icon: '🤖'
    },
    {
      name: 'NewsBlur',
      platform: 'Web/移动端',
      description: '社交化的RSS阅读器',
      icon: '🌐'
    },
    {
      name: 'FreshRSS',
      platform: '自托管',
      description: '开源的自托管RSS服务',
      icon: '🏠'
    }
  ]

  return (
    <div className={className}>
      <Card className="p-6">
        <div className="space-y-6">
          {/* 标题部分 */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">订阅博客更新</h2>
            <p className="text-gray-600">
              通过RSS订阅，及时获取最新的文章更新，不错过任何精彩内容
            </p>
          </div>

          {/* RSS链接 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">订阅链接</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">RSS 2.0 Feed</label>
                  <span className="text-xs text-gray-500">传统格式</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rssUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(rssUrl, 'rss')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      copiedUrl === 'rss'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {copiedUrl === 'rss' ? '已复制' : '复制'}
                  </button>
                  <RSSButton feedType="rss" showText={false} variant="outline" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">JSON Feed</label>
                  <span className="text-xs text-gray-500">现代格式</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={jsonUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(jsonUrl, 'json')}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      copiedUrl === 'json'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    {copiedUrl === 'json' ? '已复制' : '复制'}
                  </button>
                  <RSSButton feedType="json" showText={false} variant="outline" />
                </div>
              </div>
            </div>
          </div>

          {/* 在线阅读器 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">在线阅读器</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularReaders.map((reader) => (
                <Link
                  key={reader.name}
                  href={reader.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full ${reader.color} mt-1`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{reader.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{reader.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 移动应用 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">移动应用</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appReaders.map((app) => (
                <div
                  key={app.name}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{app.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{app.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{app.description}</p>
                      <span className="text-xs text-gray-500 mt-2 block">
                        {app.platform}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">如何使用RSS订阅？</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>复制上方的RSS链接或JSON链接</li>
              <li>在您选择的RSS阅读器中添加订阅源</li>
              <li>粘贴链接并确认订阅</li>
              <li>开始在阅读器中阅读我们的文章</li>
            </ol>
          </div>

          {/* 高级选项 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">高级订阅选项</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">按标签订阅</h4>
                <p className="text-gray-600">
                  订阅特定标签的文章：<br />
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {rssUrl}?tag=技术
                  </code>
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">按分类订阅</h4>
                <p className="text-gray-600">
                  订阅特定分类的文章：<br />
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {rssUrl}?category=前端
                  </code>
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">订阅精选文章</h4>
                <p className="text-gray-600">
                  只订阅精选文章：<br />
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {rssUrl}?featured=true
                  </code>
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">限制文章数量</h4>
                <p className="text-gray-600">
                  限制Feed中的文章数量：<br />
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                    {rssUrl}?limit=10
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}