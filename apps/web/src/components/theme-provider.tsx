'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { DirectionProvider } from '@radix-ui/react-direction';
import { TooltipProvider } from '@/components/ui/tooltip';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <DirectionProvider dir="rtl">
        <TooltipProvider delayDuration={200}>
          {children}
        </TooltipProvider>
      </DirectionProvider>
    </NextThemesProvider>
  );
}
