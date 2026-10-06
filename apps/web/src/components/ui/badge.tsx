import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold',
        secondary:
          'border-black/10 dark:border-white/[0.08] bg-black/5 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300',
        destructive:
          'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold',
        outline:
          'border-border text-foreground',
        cyan:
          'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-bold',
        amber:
          'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold',
        sky:
          'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
