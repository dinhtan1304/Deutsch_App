'use client';

import { Link } from '@/i18n/navigation';
import DrillRunner from '@/components/grammar/trainer/DrillRunner';

export default function CasesDrillPage() {
  return (
    <div className="acc-violet max-w-360 mx-auto px-4 py-2 pb-24">
      <Link href="/grammar/trainer" className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>← Grammar Trainer</Link>
      <header className="mt-3 mb-6">
        <div className="text-caption font-medium uppercase mb-1.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.08em' }}>Drill ngữ pháp</div>
        <h1 className="font-bold" style={{ fontSize: 30, letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>Các cách (Kasus)</h1>
        <p className="mt-1.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>Nominativ · Akkusativ · Dativ · Genitiv — câu ngữ cảnh, chấm tức thì</p>
      </header>
      <DrillRunner mode="cases" />
    </div>
  );
}
