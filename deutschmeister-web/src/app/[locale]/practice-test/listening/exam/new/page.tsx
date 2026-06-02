'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateExamListening } from '@/hooks/useExamListening';
import { EXAM_LISTENING_DISPLAY } from '@/lib/examConfig';
import { SetupSection } from '../../../_components/createSetup';

type IconProps = { size?: number; style?: React.CSSProperties };
function IconChevronLeft({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="15 18 9 12 15 6" /></svg>;
}
function IconLoader({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block', ...style }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function IconCheck({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconHeadphones({ size = 16, style }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', ...style }}><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a9 9 0 0 1 18 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /></svg>;
}

const LEVELS = ['A1', 'A2', 'B1'];

export default function ExamListeningNewPage() {
  const router = useRouter();
  const t = useTranslations('practice.examListening.new');
  const tSetup = useTranslations('practice.examCommon.setup');
  const tHub = useTranslations('practice.common.hub');
  const [examType, setExamType] = useState<string>('GOETHE');
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMut = useGenerateExamListening();

  const EXAM_TYPES = [
    { id: 'GOETHE', label: tSetup('goetheLabel'), color: 'var(--der)', desc: tSetup('goetheDesc') },
    { id: 'TELC', label: tSetup('telcLabel'), color: 'var(--violet)', desc: tSetup('telcDesc') },
  ];

  const isTelcA1 = examType === 'TELC' && cefrLevel === 'A1';
  const examInfo = EXAM_LISTENING_DISPLAY[examType]?.[cefrLevel];
  const ready = !isTelcA1 && !!examInfo;

  const handleGenerate = async () => {
    if (!ready || generateMut.isPending) return;
    setErrorMsg('');
    try {
      const session = await generateMut.mutateAsync({ examType, cefrLevel });
      router.push(`/practice-test/listening/exam/${session.id}`);
    } catch {
      setErrorMsg(t('errorCreate'));
    }
  };

  return (
    <div className="mx-auto max-w-360 px-4 py-6 sm:px-6">
      <Link href="/practice-test/listening/exam" className="mb-4 inline-flex items-center gap-1 text-caption font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--accent)' }}>
        <IconChevronLeft size={16} /> {tHub('back')}
      </Link>

      <header className="mb-5 flex items-center gap-3.5">
        <div className="v2-icongrad-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
          style={{ color: 'var(--accent-on)', boxShadow: '0 8px 20px color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          <IconHeadphones size={24} />
        </div>
        <div className="min-w-0">
          <h1 className="text-h1 font-extrabold leading-tight" style={{ letterSpacing: '-.02em', color: 'var(--theme-text-primary)' }}>{t('pageTitle')}</h1>
          <p className="mt-0.5 text-body" style={{ color: 'var(--theme-text-secondary)' }}>{t('pageSubtitle')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <SetupSection n={1} label={tSetup('examTypeLabel')}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {EXAM_TYPES.map((et) => {
                const on = examType === et.id;
                return (
                  <button key={et.id} onClick={() => setExamType(et.id)}
                    className="rounded-md border p-3.5 text-left transition-transform hover:-translate-y-0.5"
                    style={on
                      ? { background: `color-mix(in srgb, ${et.color} 12%, transparent)`, borderColor: et.color }
                      : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="text-body font-bold" style={{ color: on ? et.color : 'var(--theme-text-primary)' }}>{et.label}</div>
                    <div className="mt-0.5 text-[10.5px] leading-tight" style={{ color: 'var(--theme-text-muted)' }}>{et.desc}</div>
                  </button>
                );
              })}
            </div>
          </SetupSection>

          <SetupSection n={2} label={tSetup('levelLabel')}>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => {
                const unsupported = examType === 'TELC' && lvl === 'A1';
                const on = cefrLevel === lvl && !unsupported;
                return (
                  <button key={lvl} onClick={() => !unsupported && setCefrLevel(lvl)} disabled={unsupported}
                    className="rounded-md border px-2 py-3 text-center transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed"
                    style={on
                      ? { background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderColor: 'var(--accent)' }
                      : unsupported
                        ? { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', opacity: 0.4 }
                        : { background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>
                    <div className="mono text-lead font-bold" style={{ color: on ? 'var(--accent)' : 'var(--theme-text-primary)' }}>{lvl}</div>
                    {unsupported && <div className="text-[9px] font-medium" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>}
                  </button>
                );
              })}
            </div>
          </SetupSection>
        </div>

        <div className="flex flex-col gap-3.5 lg:sticky lg:top-6">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('previewLabel')}</div>

          <div className="overflow-hidden rounded-2xl border" style={{ background: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', boxShadow: 'var(--v2-shadow-card-hover)' }}>
            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--theme-border)', background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
              <div className="mb-1.5 flex items-center gap-2">
                <IconHeadphones size={16} style={{ color: 'var(--accent)' }} />
                <span className="mono rounded-[5px] px-2 py-0.5 text-[10.5px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 16%, transparent)', color: 'var(--accent)' }}>{cefrLevel}</span>
                <span className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>{examType}</span>
              </div>
              <div className="text-lead font-bold" style={{ color: 'var(--theme-text-primary)' }}>{examType} {cefrLevel} — {t('skillLabel')}</div>
            </div>

            {ready && examInfo ? (
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { v: examInfo.teile, l: tSetup('teile') },
                    { v: examInfo.questions, l: tSetup('questions') },
                    { v: `${examInfo.timeMin} ${tSetup('minutesAbbr')}`, l: tSetup('timeLabel') },
                  ].map((s, i) => (
                    <div key={i} className="rounded-md border p-2.5" style={{ background: 'var(--theme-bg-tertiary)', borderColor: 'var(--theme-border)' }}>
                      <div className="mono text-lead font-extrabold leading-none" style={{ color: 'var(--accent)' }}>{s.v}</div>
                      <div className="mt-1 text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {examInfo.structure.map((s: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-[11.5px]" style={{ color: 'var(--theme-text-secondary)' }}>
                      <span className="mono shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>{tSetup('teilLine', { i: i + 1 })}</span>
                      <span className="pt-0.5">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('naBadge')}</div>
            )}
          </div>

          <button onClick={handleGenerate} disabled={!ready || generateMut.isPending}
            className={`flex h-13 items-center justify-center gap-2.5 rounded-[13px] text-[15px] font-bold transition-transform ${ready && !generateMut.isPending ? 'hover:-translate-y-0.5 active:scale-95' : 'cursor-not-allowed'}`}
            style={ready
              ? { background: 'var(--accent)', color: 'var(--accent-on)', boxShadow: '0 6px 18px color-mix(in srgb, var(--accent) 40%, transparent)' }
              : { background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
            {generateMut.isPending ? <><IconLoader size={17} /> {t('loadingLong')}</> : <><IconCheck size={17} /> {tSetup('createExam')}</>}
          </button>
          {generateMut.isPending && <div className="-mt-1 text-center text-[11.5px]" style={{ color: 'var(--theme-text-muted)' }}>{t('loadingHint')}</div>}
          {errorMsg && <p className="text-center text-caption" style={{ color: 'var(--danger)' }}>{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
