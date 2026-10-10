import { locale, messages } from '@saf-shekan/i18n';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(() => ({
  locale,
  messages,
}));
