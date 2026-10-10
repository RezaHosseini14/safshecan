import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { locale, messages, t } from '@saf-shekan/i18n';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const yekanBakh = localFont({
  src: '../../public/fonts/joys-yekan-bakh-vf.woff2',
  variable: '--font-yekan-bakh',
  display: 'swap',
  weight: '100 900',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: t('common', 'brandTitle'),
  description: t('common', 'brandDescription'),
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#070b14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${yekanBakh.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
