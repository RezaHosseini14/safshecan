export const APP_VERSION = '2.0.0';

export type ChangelogSectionKey = 'added' | 'changed' | 'fixed' | 'removed' | 'security';

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
  titleKey: string;
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
    titleKey: 'entries.v2_0_0.title',
    added: [
      'entries.v2_0_0.added.footerVersion',
      'entries.v2_0_0.added.modalCategories',
    ],
  },
];
