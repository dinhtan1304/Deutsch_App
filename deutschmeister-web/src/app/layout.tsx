import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MainLayout } from '@/components/layout';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Deutschmeister - Học tiếng Đức cho người Việt',
  description: 'Ứng dụng học tiếng Đức với giải thích song ngữ Đức-Việt, tập trung vào Der/Die/Das và từ vựng A1-B1',
  keywords: ['học tiếng Đức', 'German learning', 'Der Die Das', 'Vietnamese German'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}