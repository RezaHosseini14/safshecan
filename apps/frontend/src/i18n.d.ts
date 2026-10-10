import type { I18nMessages } from '@saf-shekan/i18n';

declare module 'use-intl/dist/types/core/AppConfig.js' {
  interface AppConfig {
    Locale: 'fa';
    Messages: I18nMessages;
  }
}
