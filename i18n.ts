import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // Default to Italian. In production, this would read from user profile/cookie
  const locale = 'it';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
