import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.ComponentProps<'article'>) {
  return (
    <article
      className={cn(
        'rounded-xl border border-white/10 bg-[#0f131c]/90 p-5 shadow-xs backdrop-blur-md',
        className
      )}
      {...props}
    />
  );
}
