import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { MainLayout } from '@/components/layout';
import { Providers } from './providers';
import { GA_ID } from '@/lib/analytics';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

// Enables fully static rendering of locale-prefixed pages at build time.
// Without this, every page would default to dynamic on the [locale] segment.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#6366F1',
};

// next-intl resolves Open Graph locale codes from a small map — we keep it
// inline since there are only 3 locales.
const OG_LOCALE: Record<string, string> = {
  vi: 'vi_VN',
  en: 'en_US',
  de: 'de_DE',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Cast string → AppLocale; the param has already passed through middleware,
  // so unknown locales never reach this layout.
  const t = await getTranslations({ locale: locale as 'vi' | 'en' | 'de', namespace: 'metadata' });
  // `canonical` mirrors `localePrefix: 'as-needed'` — vi has no prefix.
  const canonical = locale === routing.defaultLocale ? '/' : `/${locale}`;

  return {
    title: { default: t('rootTitle'), template: `%s | ${t('siteName')}` },
    description: t('rootDescription'),
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
      locale: OG_LOCALE[locale] ?? OG_LOCALE.vi,
      siteName: t('siteName'),
      title: t('rootTitle'),
      description: t('rootDescription'),
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: t('ogImageAlt') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('rootTitle'),
      description: t('twitterDescription'),
      images: ['/opengraph-image'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
      canonical,
      // Next.js emits one <link rel="alternate" hreflang="…"> per entry, plus x-default.
      languages: {
        vi: '/',
        en: '/en',
        de: '/de',
        'x-default': '/',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // The middleware should already block invalid locales, but defend in depth
  // so a hand-typed `/xx/...` renders 404 instead of a half-broken page.
  if (!hasLocale(routing.locales, locale)) notFound();
  // Required for next-intl when using static rendering with `generateStaticParams`.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Blocking theme script — runs before paint to prevent FOUC. Mirrors applyTheme() in settingsStore.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('deutschmeister-settings');var t='system';if(s){try{t=(JSON.parse(s).theme||'system');}catch(e){}}var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var h=document.documentElement;h.setAttribute('data-theme',r);h.classList.remove('light','dark');h.classList.add(r);h.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
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
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <MainLayout>{children}</MainLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
