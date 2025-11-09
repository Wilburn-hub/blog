'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
]

export function LanguageSwitcher() {
  const t = useTranslations('language')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const currentLanguage = languages.find(lang => lang.code === locale)

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from pathname
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '') || '/'

    // Add the new locale
    const newPathname = newLocale === 'zh'
      ? pathnameWithoutLocale
      : `/${newLocale}${pathnameWithoutLocale}`

    router.push(newPathname)

    // Save preference to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; max-age=31536000; path=/`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t('switch_language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <span className="text-sm font-medium">{t('switch_language')}</span>
        </div>
        <DropdownMenuSeparator />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}