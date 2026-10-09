import * as React from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-white/10 bg-[#070b14] px-3 py-2 font-mono text-xs text-slate-100 outline-none focus:border-cyan-400',
        className
      )}
      {...props}
    />
  );
}
