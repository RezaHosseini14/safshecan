'use client';

import { ScrollText } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  APP_VERSION,
  CHANGELOG,
  CHANGELOG_SECTION_ORDER,
  type ChangelogSectionKey,
} from '@/data/changelog';

export interface IChangelogModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function formatChangelogDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

function sectionBadgeVariant(
  key: ChangelogSectionKey,
): 'emerald' | 'cyan' | 'amber' | 'rose' | 'muted' {
  switch (key) {
    case 'added':
      return 'emerald';
    case 'changed':
      return 'cyan';
    case 'fixed':
      return 'muted';
    case 'security':
      return 'rose';
    default:
      return 'muted';
  }
}

function ChangelogItemList({ items }: { readonly items: string[] }) {
  return (
    <ul className="space-y-2.5" role="list">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <span
            className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary/80"
            aria-hidden
          />
          <span className="min-w-0 flex-1 text-pretty text-foreground/90">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChangelogModal({ open, onOpenChange }: IChangelogModalProps) {
  const t = useTranslations('shell.changelog');
  const tChangelog = useTranslations('changelog');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(36rem,88dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        dir="rtl"
      >
        <DialogHeader className="border-b border-border bg-gradient-to-b from-primary/[0.12] to-transparent px-5 pb-4 pt-5">
          <div className="flex items-start gap-3 pe-7">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
              aria-hidden
            >
              <ScrollText className="size-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <DialogTitle className="text-base tracking-tight">{t('title')}</DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-sm">
                <span>{t('currentVersionLabel')}</span>
                <Badge
                  variant="emerald"
                  className="font-mono text-[11px] tabular-nums"
                >
                  v{APP_VERSION}
                </Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {CHANGELOG.map((entry) => (
            <section
              key={entry.version}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-primary ring-1 ring-primary/25">
                    v{entry.version}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{tChangelog(entry.titleKey)}</h3>
                </div>
                <time
                  dateTime={entry.date}
                  className="shrink-0 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {formatChangelogDate(entry.date, 'fa-IR')}
                </time>
              </div>
              <div className="space-y-4 p-4">
                {CHANGELOG_SECTION_ORDER.map((sectionKey) => {
                  const itemKeys = entry[sectionKey];
                  if (!itemKeys?.length) {
                    return null;
                  }

                  const items = itemKeys.map((key) => tChangelog(key));

                  return (
                    <div
                      key={sectionKey}
                      className={cn(
                        'rounded-xl border border-border/80 bg-muted/30 p-3',
                        sectionKey === 'added' && 'border-primary/25 bg-primary/[0.06]',
                      )}
                    >
                      <Badge
                        variant={sectionBadgeVariant(sectionKey)}
                        className="mb-2.5 h-6 px-2.5 text-[11px]"
                      >
                        {tChangelog(`sections.${sectionKey}`)}
                      </Badge>
                      <ChangelogItemList items={items} />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
