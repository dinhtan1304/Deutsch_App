'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGenerateExamWriting } from '@/hooks/useExamWriting';
import { PageHeader } from '@/components/ui';
import { EXAM_WRITING_DISPLAY } from '@/lib/examConfig';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

function IconLoader({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ display: 'block' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}

const LEVELS = ['A1', 'A2', 'B1'];

export default function ExamWritingNewPage() {
  const router = useRouter();
  const t = useTranslations('practice.examWriting.new');
  const tSetup = useTranslations('practice.examCommon.setup');
  const [examType, setExamType] = useState<string>('GOETHE');
  const [cefrLevel, setCefrLevel] = useState<string>('B1');
  const [errorMsg, setErrorMsg] = useState('');

  const generateMut = useGenerateExamWriting();

  const EXAM_TYPES = [
    { id: 'GOETHE', label: tSetup('goetheLabel'), color: ACCENT.srs, desc: tSetup('goetheDesc') },
    { id: 'TELC', label: tSetup('telcLabel'), color: ACCENT.vocab, desc: tSetup('telcDesc') },
  ];

  const isTelcA1 = examType === 'TELC' && cefrLevel === 'A1';
  const examInfo = EXAM_WRITING_DISPLAY[examType]?.[cefrLevel];

  const handleGenerate = async () => {
    if (isTelcA1) return;
    setErrorMsg('');
    try {
      const session = await generateMut.mutateAsync({ examType, cefrLevel });
      router.push(`/practice-test/writing/exam/${session.id}`);
    } catch {
      setErrorMsg(t('errorCreate'));
    }
  };

  return (
    <div className="py-6">
      <PageHeader
        backHref="/practice-test/writing/exam"
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        accent="writing"
      />

      {/* Step 1: Exam type */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {tSetup('step1Label')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {EXAM_TYPES.map(et => (
            <button key={et.id} onClick={() => setExamType(et.id)}
              className="p-4 rounded-2xl border-2 text-left transition-all"
              style={examType === et.id
                ? { borderColor: et.color, backgroundColor: `${et.color}1A` }
                : { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
              <div className="text-[15px] font-bold"
                style={{ color: examType === et.id ? et.color : 'var(--theme-text-primary)' }}>
                {et.label}
              </div>
              <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{et.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Level */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--theme-text-muted)' }}>
          {tSetup('step2Label')}
        </p>
        <div className="flex gap-2">
          {LEVELS.map(lvl => {
            const unsupported = examType === 'TELC' && lvl === 'A1';
            return (
              <button key={lvl} onClick={() => !unsupported && setCefrLevel(lvl)}
                disabled={unsupported}
                className="flex-1 py-3 rounded-2xl border-2 font-bold text-[15px] transition-all"
                style={cefrLevel === lvl && !unsupported
                  ? { borderColor: ACCENT.examWriting, backgroundColor: `${ACCENT.examWriting}1A`, color: ACCENT.examWriting }
                  : unsupported
                    ? { borderColor: 'var(--theme-border)', color: 'var(--theme-text-muted)', opacity: 0.4, cursor: 'not-allowed', backgroundColor: 'transparent' }
                    : { borderColor: 'var(--theme-border)', color: 'var(--theme-text-primary)', backgroundColor: 'transparent' }}>
                {lvl}
                {unsupported && <div className="text-[9px] font-normal">{tSetup('naBadge')}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary card */}
      {examInfo && !isTelcA1 && (
        <div className="rounded-2xl border p-4 mb-6"
          style={{ borderColor: `${ACCENT.examWriting}4D`, backgroundColor: `${ACCENT.examWriting}0A` }}>
          <p className="text-body font-bold mb-2" style={{ color: ACCENT.examWriting }}>
            {examType} {cefrLevel} — {t('skillLabel')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-title font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.teile}</div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('teile')}</div>
            </div>
            <div>
              <div className="text-title font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.timeMin} {tSetup('minutesAbbr')}</div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('timeLabel')}</div>
            </div>
            <div>
              <div className="text-title font-extrabold" style={{ color: 'var(--theme-text-primary)' }}>{examInfo.totalPoints}</div>
              <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('maxPoints')}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            {examInfo.structure.map((s: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
                <span className="w-14 font-bold" style={{ color: 'var(--theme-text-muted)' }}>{tSetup('teilLine', { i: i + 1 })}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl text-body mb-4"
          style={{ backgroundColor: `${STATUS.danger}14`, color: STATUS.danger }}>
          {errorMsg}
        </div>
      )}

      <button onClick={handleGenerate}
        disabled={generateMut.isPending || isTelcA1}
        className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        style={{ background: GRADIENT.examWriting, boxShadow: `0 4px 12px ${ACCENT.examWriting}4D` }}>
        {generateMut.isPending ? (
          <><IconLoader size={18} /> {t('loadingShort')}</>
        ) : (
          tSetup('createExam')
        )}
      </button>

      {generateMut.isPending && (
        <p className="text-center text-xs mt-3" style={{ color: 'var(--theme-text-muted)' }}>
          {t('loadingHint')}
        </p>
      )}
    </div>
  );
}
