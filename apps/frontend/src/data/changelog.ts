export const APP_VERSION = '2.0.0';

export type ChangelogSectionKey = 'added' | 'changed' | 'fixed' | 'removed' | 'security';

export const CHANGELOG_SECTION_LABELS: Record<ChangelogSectionKey, string> = {
  added: 'افزوده‌شده',
  changed: 'بهبود و تغییر',
  fixed: 'رفع اشکال',
  removed: 'حذف‌شده',
  security: 'امنیت',
};

export const CHANGELOG_SECTION_ORDER: ChangelogSectionKey[] = [
  'added',
  'changed',
  'fixed',
  'removed',
  'security',
];

export interface IChangelogEntry {
  version: string;
  date: string;
  title: string;
  added?: string[];
  changed?: string[];
  fixed?: string[];
  removed?: string[];
  security?: string[];
}

export const CHANGELOG: IChangelogEntry[] = [
  {
    version: '2.0.0',
    date: '2026-11-07',
    title: 'صف‌شکن ۲ — ترمینال سرخطی',
    added: [
      'نمایش شماره نسخه در فوتر و باز کردن فهرست تغییرات با یک کلیک',
      'مودال تغییرات نسخه با دسته‌بندی افزوده‌شده، بهبود، رفع اشکال و امنیت',
    ],
  },
];
