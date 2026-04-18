import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { MainLayout } from '@/components/layout';
import { Providers } from './providers';
import { GA_ID } from '@/lib/analytics';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: {
    default: 'Deutschmeister — Học tiếng Đức cùng AI | Luyện thi Goethe & TELC',
    template: '%s | Deutschmeister',
  },
  description:
    'Nền tảng học tiếng Đức toàn diện dành cho người Việt. 5000+ từ vựng, 8 trò chơi, AI chấm 4 kỹ năng Nghe-Nói-Đọc-Viết, đề thi chuẩn Goethe/TELC A1-B1.',
  keywords: [
    'học tiếng Đức', 'luyện thi Goethe', 'luyện thi TELC',
    'tiếng Đức A1', 'tiếng Đức A2', 'tiếng Đức B1',
    'Der Die Das', 'từ vựng tiếng Đức', 'ngữ pháp tiếng Đức',
    'German learning Vietnamese', 'Deutschmeister',
  ],
  authors: [{ name: 'Deutschmeister' }],
  creator: 'Deutschmeister',
  metadataBase: new URL('https://www.deutschmeister.vn'),
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Deutschmeister',
    title: 'Deutschmeister — Học tiếng Đức cùng AI | Luyện thi Goethe & TELC',
    description:
      'Nền tảng học tiếng Đức toàn diện dành cho người Việt. 5000+ từ vựng, 8 trò chơi, AI chấm 4 kỹ năng, đề thi chuẩn Goethe/TELC A1-B1.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Deutschmeister — Học tiếng Đức cùng AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deutschmeister — Học tiếng Đức cùng AI',
    description: '5000+ từ vựng, 8 trò chơi, AI chấm 4 kỹ năng, đề thi chuẩn Goethe/TELC A1-B1.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}</Script>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}