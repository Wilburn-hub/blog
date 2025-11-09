import { useTranslations } from 'next-intl'

export default function TagsPage() {
  const t = useTranslations('tags')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {t('all_tags')}
      </h1>

      <div className="text-center py-16 text-muted-foreground">
        <p>{t('no_tags')}</p>
        <p className="mt-2">{t('no_tags_description')}</p>
      </div>
    </div>
  )
}