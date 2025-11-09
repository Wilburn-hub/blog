import { useTranslations } from 'next-intl'

export default function SubscribePage() {
  const t = useTranslations('subscribe')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">
        {t('page_title')}
      </h1>

      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            {t('email_subscription')}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t('rss_description')}
          </p>
          <div className="flex space-x-4">
            <input
              type="email"
              placeholder={t('email_placeholder')}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t('subscribe_button')}
            </button>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">
            {t('rss_feed')}
          </h2>
          <p className="mb-4 text-muted-foreground">
            {t('rss_description')}
          </p>
          <div className="flex space-x-4">
            <a href="/rss.xml" className="text-primary hover:underline">
              RSS Feed
            </a>
            <a href="/feed.json" className="text-primary hover:underline">
              JSON Feed
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}