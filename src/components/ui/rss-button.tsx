'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RSSButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  feedType?: 'rss' | 'json' | 'both'
}

export function RSSButton({
  variant = 'default',
  size = 'md',
  showText = true,
  className,
  feedType = 'rss'
}: RSSButtonProps) {
  const [copied, setCopied] = useState(false)

  const getFeedUrl = (type: 'rss' | 'json') => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'
    return type === 'rss' ? `${baseUrl}/rss` : `${baseUrl}/feed.json`
  }

  const copyToClipboard = async (url: string, type: 'rss' | 'json') => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white'
      case 'ghost':
        return 'text-orange-500 hover:bg-orange-50 hover:text-orange-600'
      default:
        return 'bg-orange-500 text-white hover:bg-orange-600'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-sm'
      case 'lg':
        return 'px-4 py-2 text-lg'
      default:
        return 'px-3 py-1.5 text-sm'
    }
  }

  const RSSIcon = ({ className: iconClassName }: { className?: string }) => (
    <svg
      className={iconClassName}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.37 20 6.18 20 5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m5.66 0a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 9.66 7.27V4.44z"/>
    </svg>
  )

  const JSONIcon = ({ className: iconClassName }: { className?: string }) => (
    <svg
      className={iconClassName}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 3h2v2H5V3zm0 16h2v2H5v-2zm0-4h2v2H5v-2zm0-4h2v2H5v-2zm0-4h2v2H5V7zm4-4h2v2H9V3zm0 16h2v2H9v-2zm0-4h2v2H9v-2zm0-4h2v2H9v-2zm0-4h2v2H9V7zm4-4h2v2h-2V3zm0 16h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7zm4-4h2v2h-2V3zm0 16h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7z"/>
    </svg>
  )

  if (feedType === 'both') {
    return (
      <div className={cn('flex gap-2', className)}>
        <Link
          href="/rss"
          className={cn(
            'inline-flex items-center gap-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
            getVariantClasses(),
            getSizeClasses()
          )}
          title="订阅 RSS Feed"
        >
          <RSSIcon className="w-4 h-4" />
          {showText && 'RSS'}
        </Link>
        <Link
          href="/feed.json"
          className={cn(
            'inline-flex items-center gap-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            getVariantClasses().replace('orange', 'blue'),
            getSizeClasses()
          )}
          title="订阅 JSON Feed"
        >
          <JSONIcon className="w-4 h-4" />
          {showText && 'JSON'}
        </Link>
      </div>
    )
  }

  const url = getFeedUrl(feedType)
  const icon = feedType === 'rss' ? RSSIcon : JSONIcon
  const title = feedType === 'rss' ? 'RSS Feed' : 'JSON Feed'
  const text = feedType === 'rss' ? 'RSS' : 'JSON'

  return (
    <div className={cn('relative group', className)}>
      <Link
        href={url}
        className={cn(
          'inline-flex items-center gap-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
          getVariantClasses(),
          getSizeClasses()
        )}
        title={`订阅 ${title}`}
      >
        <icon className="w-4 h-4" />
        {showText && text}
      </Link>

      {/* 复制按钮 */}
      <button
        onClick={() => copyToClipboard(url, feedType)}
        className={cn(
          'absolute -top-1 -right-1 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity',
          copied && 'bg-green-600'
        )}
        title={`复制${title}链接`}
      >
        {copied ? '已复制' : '复制'}
      </button>
    </div>
  )
}