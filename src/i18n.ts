import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export default getRequestConfig(async () => {
  // Get the locale from the cookie
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'zh';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});