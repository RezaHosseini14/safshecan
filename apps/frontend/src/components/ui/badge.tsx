import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
  {
    variants: {
      variant: {
        emerald: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
        cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
        amber: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
        rose: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
        muted: 'border-white/10 bg-white/5 text-slate-300',
      },
    },
    defaultVariants: { variant: 'muted' },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
