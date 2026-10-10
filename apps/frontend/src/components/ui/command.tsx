'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      dir="rtl"
      className={cn('flex h-full w-full flex-col overflow-hidden rounded-lg bg-[#0f131c] text-slate-100', className)}
      {...props}
    />
  );
}

export function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-white/10 px-3">
      <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <CommandPrimitive.Input
        className={cn(
          'flex h-10 w-full bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500',
          className
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('max-h-80 overflow-y-auto overflow-x-hidden', className)} {...props} />;
}

export function CommandEmpty({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={cn('py-6 text-center text-xs text-slate-400', className)} {...props} />;
}

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group className={cn('p-1', className)} {...props} />;
}

export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        'relative flex cursor-pointer select-none flex-col items-stretch gap-0.5 rounded-md py-2 pe-2 ps-2 text-xs outline-none data-[selected=true]:bg-white/10',
        className
      )}
      {...props}
    />
  );
}
