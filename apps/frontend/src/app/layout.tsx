import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';
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
  title: 'صف‌شکن (SafShekan) - ترمینال سرخطی‌زن فوق‌سریع بورس تهران',
  description: 'ترمینال سرخطی بورس تهران با ساعت NTP، شلیک رگباری و دیده‌بان TSETMC',
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
