'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        dir="rtl"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-white/10 bg-[#141924] text-slate-100 shadow-xl outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
