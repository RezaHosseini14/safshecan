import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-[0.98] border border-emerald-300/40',
        destructive:
          'bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 hover:border-rose-500/60 text-rose-600 dark:text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.18)] active:scale-95',
        outline:
          'bg-white/40 dark:bg-white/[0.04] hover:bg-black/5 dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/[0.09] text-foreground hover:border-sky-400/40 active:scale-95',
        secondary:
          'bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.1] text-foreground border border-black/10 dark:border-white/[0.08] active:scale-95',
        ghost:
          'hover:bg-black/5 dark:hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-95',
        link: 'text-primary underline-offset-4 hover:underline',
        cyan:
          'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.01] active:scale-95 border border-cyan-300/40',
        armed:
          'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 cursor-not-allowed opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-12 rounded-xl px-6 text-sm',
        hero: 'h-14 rounded-xl px-8 text-sm',
        icon: 'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
