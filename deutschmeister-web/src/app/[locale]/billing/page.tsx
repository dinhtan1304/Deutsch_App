'use client';
/* eslint-disable no-restricted-syntax */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';

export default function BillingPage() {
  const t = useTranslations('account.billing');
  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--theme-text-primary)', marginBottom: 8 }}>
        {t('betaTitle')}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
        {t('betaBody')}
      </p>
      <Link href="/dashboard" style={{
        display: 'inline-block', padding: '10px 24px', borderRadius: 10,
        backgroundColor: ACCENT.writing, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
      }}>
        {t('backToDashboard')}
      </Link>
    </div>
  );
}
