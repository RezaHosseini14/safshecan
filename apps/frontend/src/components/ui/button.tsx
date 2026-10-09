import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(78,222,163,0.35)] hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99]',
        outline:
          'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white',
        destructive:
          'border border-rose-500/80 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white',
        ghost: 'text-slate-300 hover:bg-white/10 hover:text-white',
        chip: 'border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300 hover:border-emerald-500/30 hover:text-emerald-300',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3',
        lg: 'h-12 px-6 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
