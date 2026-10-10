import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Num({ className, ...props }: ComponentProps<'span'>) {
  return <span dir="ltr" className={cn('num-mono', className)} {...props} />;
}
