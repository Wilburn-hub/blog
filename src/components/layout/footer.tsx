'use client'

import Link from 'next/link'
import React from 'react'
import { Github, Twitter, Mail, Heart, PenSquare, Rss } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Separator } from '@/components/ui/separator'
import { RSSButton } from '@/components/ui/rss-button'

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
    href: '/rss',
    icon: Rss,
  },
]

export function Footer() {
  const locale = useLocale()
  const t = useTranslations()
  const currentYear = new Date().getFullYear()

  // Build footer links dynamically
  const footerLinks = [
    {
      title: t('navigation.posts'),
      links: [
        { name: t('posts.all_posts'), href: '/posts' },
        { name: t('navigation.categories'), href: '/categories' },
        { name: t('navigation.tags'), href: '/tags' },
        { name: 'Archive', href: '/archive' },
      ],
    },
    {
      title: t('navigation.about'),
      links: [
        { name: t('about.page_title'), href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Friends', href: '/friends' },
        { name: t('navigation.subscribe'), href: '/subscribe' },
      ],
    },
    {
      title: 'Features',
      links: [
        { name: t('common.search'), href: '/search' },
        { name: 'Write', href: '/write' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Settings', href: '/settings' },
      ],
    },
  ]

  // Build href with locale
  const buildHref = (href: string) => {
    return locale === 'zh' ? href : `/${locale}${href}`
  }

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
              <span className="text-xl font-bold">{t('seo.site_name')}</span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t('seo.default_description')}
            </p>

            {/* RSS订阅区域 */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t('subscribe.email_subscription')}</p>
              <RSSButton feedType="both" size="sm" className="w-full" />
              <p className="text-xs text-muted-foreground">
                {t('subscribe.rss_description')}
              </p>
            </div>

            {/* 社交媒体链接 */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">{t('footer.social_links')}</p>
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
          </div>

          {/* Footer links */}
          {footerLinks.map(section => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map(link => (
                  <li key={link.name}>
                    <Link
                      href={buildHref(link.href)}
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
            <span>{t('footer.copyright', { year: currentYear, name: 'Your Name' })}</span>
            <span className="text-primary">•</span>
            <span>Made with</span>
            <Heart className="h-4 w-4 fill-current text-red-500" />
            <span>by Your Name</span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/rss" className="transition-colors hover:text-foreground">
              {t('subscribe.rss_feed')}
            </Link>
            <Link href="/feed.json" className="transition-colors hover:text-foreground">
              JSON Feed
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/sitemap.xml" className="transition-colors hover:text-foreground">
              Sitemap
            </Link>
          </div>
        </div>

        {/* Additional footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            {t('footer.powered_by', { technology: 'Next.js & Tailwind CSS' })}
          </p>
          <p className="mt-1">
            This site is licensed under{' '}
            <Link
              href="https://creativecommons.org/licenses/by/4.0/"
              className="transition-colors hover:text-foreground"
            >
              CC BY 4.0
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
