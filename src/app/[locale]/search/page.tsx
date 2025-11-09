import { useTranslations } from 'next-intl'

export default function SearchPage() {
  const t = useTranslations('search')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {t('page_title')}
      </h1>

      <div className="max-w-2xl">
        <input
          type="search"
          placeholder={t('search_query')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />

        <div className="mt-8 text-center text-muted-foreground">
          <p>{t('no_results')}</p>
          <p className="mt-2">{t('no_results_description')}</p>
        </div>
      </div>
    </div>
  )
}