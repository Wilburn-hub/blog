import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="py-20 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
          {t('hero_title')}
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t('hero_subtitle')}
        </p>
      </section>

      <section className="py-16">
        <h2 className="mb-8 text-3xl font-bold text-center">
          {t('latest_posts')}
        </h2>
        <div className="text-center text-muted-foreground">
          <p>{t('no_posts_found')}</p>
          <p className="mt-2">{t('no_posts_description')}</p>
        </div>
      </section>
    </div>
  )
}