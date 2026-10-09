import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Vazirmatn } from 'next/font/google';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
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
    <html lang="fa" dir="rtl" className={`dark ${vazirmatn.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
