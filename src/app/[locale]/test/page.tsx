'use client'

import { useTranslations, useLocale } from 'next-intl'
import { LanguageSwitcher } from '@/components/ui/language-switcher'

export default function TestPage() {
  const t = useTranslations()
  const locale = useLocale()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">
          国际化测试页面 / Internationalization Test Page
        </h1>

        <div className="mb-8">
          <p className="mb-4">
            <strong>当前语言 / Current Locale:</strong> {locale}
          </p>

          <div className="mb-4">
            <p><strong>语言切换器 / Language Switcher:</strong></p>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xl font-semibold">导航测试 / Navigation Test</h2>
            <ul className="space-y-2">
              <li>首页: {t('navigation.home')}</li>
              <li>文章: {t('navigation.posts')}</li>
              <li>分类: {t('navigation.categories')}</li>
              <li>标签: {t('navigation.tags')}</li>
              <li>关于: {t('navigation.about')}</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xl font-semibold">通用测试 / Common Test</h2>
            <ul className="space-y-2">
              <li>搜索: {t('common.search')}</li>
              <li>读取更多: {t('common.read_more')}</li>
              <li>复制: {t('common.copy')}</li>
              <li>分享: {t('common.share')}</li>
              <li>保存: {t('common.save')}</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xl font-semibold">首页测试 / Home Test</h2>
            <ul className="space-y-2">
              <li>标题: {t('home.hero_title')}</li>
              <li>副标题: {t('home.hero_subtitle')}</li>
              <li>最新文章: {t('home.latest_posts')}</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xl font-semibold">关于页面测试 / About Test</h2>
            <ul className="space-y-2">
              <li>页面标题: {t('about.page_title')}</li>
              <li>介绍: {t('about.introduction')}</li>
              <li>技能: {t('about.skills_title')}</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4">
            <h2 className="mb-3 text-xl font-semibold">参数化测试 / Parameterized Test</h2>
            <ul className="space-y-2">
              <li>版权信息: {t('footer.copyright', { year: new Date().getFullYear(), name: 'Your Name' })}</li>
              <li>技术栈: {t('footer.powered_by', { technology: 'Next.js & Tailwind CSS' })}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}