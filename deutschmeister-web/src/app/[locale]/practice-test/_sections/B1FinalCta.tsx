'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { IconArrowRight, IconBookOpen, IconPenLine, IconUserPlus } from '@/components/ui/Icons';
import { useAuthStore } from '@/stores/authStore';

export function B1FinalCta() {
  const t = useTranslations('practice.guideB1.cta');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // During hydration, show a neutral state to avoid flash mismatch
  if (!hasHydrated) {
    return <div className="h-32" aria-hidden />;
  }

  return (
    <section className="mb-8">
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent) 5%, var(--theme-bg-card))',
          border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
        }}
      >
        <div className="relative">
          {isAuthenticated ? (
            <>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {t('readyTitle')}
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--theme-text-secondary)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                {t('readyBody')}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/practice-test/reading/exam"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] text-body font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: 'var(--success)', boxShadow: '0 4px 12px color-mix(in srgb, var(--success) 32%, transparent)' }}
                >
                  <IconBookOpen size={16} />
                  {t('lesenBtn')}
                  <IconArrowRight size={14} />
                </Link>
                <Link
                  href="/practice-test/writing/exam"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] text-body font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: 'var(--violet)', boxShadow: '0 4px 12px color-mix(in srgb, var(--violet) 32%, transparent)' }}
                >
                  <IconPenLine size={16} />
                  {t('schreibenBtn')}
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                {t('startTitle')}
              </h3>
              <p className="text-body mb-6" style={{ color: 'var(--theme-text-secondary)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                {t('startBody')}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] text-body font-bold transition-transform hover:-translate-y-0.5"
                  style={{ background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 35%, transparent)' }}
                >
                  <IconUserPlus size={16} />
                  {t('registerBtn')}
                  <IconArrowRight size={14} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] text-body font-bold transition-colors"
                  style={{
                    backgroundColor: 'var(--theme-bg-card)',
                    color: 'var(--theme-text-primary)',
                    border: '1px solid var(--theme-border)',
                  }}
                >
                  {t('loginBtn')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
