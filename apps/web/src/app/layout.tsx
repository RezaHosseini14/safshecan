import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const yekanBakh = localFont({
  src: [
    {
      path: '../fonts/joys-yekan-bakh/woff2/joys-yekan-bakh-fanum-vf.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-yekan-bakh',
  display: 'swap',
});

const yekanBakhEn = localFont({
  src: [
    {
      path: '../fonts/joys-yekan-bakh/woff2/joys-yekan-bakh-vf.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-yekan-bakh-en',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'صف‌شکن (SafShekan) - ترمینال فوق‌سریع سرخطی بورس و عرضه‌های اولیه',
  description:
    'سامانه مدرن و فوق‌سریع سرخطی بورس تهران با ساعت اتمی NTP، شلیک رگباری میلی‌ثانیه‌ای، تحلیل خودکار cURL و شبیه‌ساز تاریخی عرضه اولیه',
  keywords: ['صف شکن', 'سرخطی', 'بورس تهران', 'عرضه اولیه', 'ساعت اتمی', 'HFT', 'tsetmc'],
  authors: [{ name: 'SafShekan Team' }],
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#070b12' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={`${yekanBakh.variable} ${yekanBakhEn.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="antialiased bg-background text-foreground transition-colors duration-200"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
