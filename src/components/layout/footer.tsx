import Link from 'next/link'
import React from 'react'
import { Github, Twitter, Mail, Heart, PenSquare, Rss } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com',
    icon: Github,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: Twitter,
  },
  {
    name: 'Email',
    href: 'mailto:your-email@example.com',
    icon: Mail,
  },
  {
    name: 'RSS',
    href: '/rss.xml',
    icon: Rss,
  },
]

const footerLinks = [
  {
    title: '博客',
    links: [
      { name: '所有文章', href: '/posts' },
      { name: '分类', href: '/categories' },
      { name: '标签', href: '/tags' },
      { name: '归档', href: '/archive' },
    ],
  },
  {
    title: '关于',
    links: [
      { name: '关于我', href: '/about' },
      { name: '联系方式', href: '/contact' },
      { name: '友情链接', href: '/friends' },
      { name: '订阅', href: '/subscribe' },
    ],
  },
  {
    title: '功能',
    links: [
      { name: '搜索', href: '/search' },
      { name: '写作', href: '/write' },
      { name: '仪表板', href: '/dashboard' },
      { name: '设置', href: '/settings' },
    ],
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <PenSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">个人博客</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              分享技术、生活、思考的个人博客空间。专注于Web开发、人工智能和用户体验设计。
            </p>
            <div className="flex space-x-2">
              {socialLinks.map(link => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Footer links */}
          {footerLinks.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Copyright and additional info */}
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>© {currentYear} 个人博客. All rights reserved.</span>
            <span className="text-primary">•</span>
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-current text-red-500" />
            <span>by Your Name</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              隐私政策
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              服务条款
            </Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-foreground">
              站点地图
            </Link>
          </div>
        </div>

        {/* Additional footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Powered by{' '}
            <Link href="https://nextjs.org" className="transition-colors hover:text-foreground">
              Next.js
            </Link>{' '}
            &{' '}
            <Link
              href="https://tailwindcss.com"
              className="transition-colors hover:text-foreground"
            >
              Tailwind CSS
            </Link>
          </p>
          <p className="mt-1">
            本网站采用{' '}
            <Link
              href="https://creativecommons.org/licenses/by/4.0/"
              className="transition-colors hover:text-foreground"
            >
              CC BY 4.0
            </Link>{' '}
            协议，欢迎转载和分享
          </p>
        </div>
      </div>
    </footer>
  )
}
