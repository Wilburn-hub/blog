import { useTranslations } from 'next-intl'

export default function AboutPage() {
  const t = useTranslations('about')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {t('page_title')}
      </h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-lg text-muted-foreground">
          {t('introduction')}
        </p>

        <section className="mt-12">
          <h2>{t('skills_title')}</h2>
          <p>技能内容将在后续添加...</p>
        </section>

        <section className="mt-12">
          <h2>{t('experience_title')}</h2>
          <p>工作经历将在后续添加...</p>
        </section>

        <section className="mt-12">
          <h2>{t('education_title')}</h2>
          <p>教育背景将在后续添加...</p>
        </section>

        <section className="mt-12">
          <h2>{t('contact_title')}</h2>
          <p>联系方式将在后续添加...</p>
        </section>
      </div>
    </div>
  )
}