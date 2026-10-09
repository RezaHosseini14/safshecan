'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const iconChrome =
  'border border-white/[0.08] bg-white/[0.05] shadow-xs hover:border-white/20 hover:bg-white/10 active:scale-95 light:border-slate-200 light:bg-slate-100 light:hover:border-slate-300 light:hover:bg-slate-200';

function BeakerIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

export function HeaderActions() {
  const { resolvedTheme, setTheme } = useTheme();
  const light = resolvedTheme === 'light';

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(iconChrome, 'text-amber-400 hover:text-amber-400')}
        title="آزمایشگاه / فیچرهای بتا"
        aria-label="آزمایشگاه / فیچرهای بتا"
      >
        <BeakerIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(iconChrome, 'text-cyan-400 hover:text-cyan-400')}
        title="تغییر پوسته"
        aria-label={light ? 'تغییر پوسته به تیره' : 'تغییر پوسته به روشن'}
        aria-pressed={light}
        onClick={() => setTheme(light ? 'dark' : 'light')}
      >
        {light ? <SunIcon /> : <MoonIcon />}
      </Button>
    </div>
  );
}
