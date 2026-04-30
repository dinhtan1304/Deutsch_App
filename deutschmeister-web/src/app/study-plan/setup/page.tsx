'use client';
/* eslint-disable no-restricted-syntax */

import { useState } from 'react';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { useRouter } from 'next/navigation';
import { useCreateStudyPlan } from '@/hooks/useStudyPlan';

const EXAM_OPTIONS = [
  {
    id: 'GOETHE',
    name: 'Goethe-Zertifikat',
    description: 'Chứng chỉ uy tín nhất của Viện Goethe',
    levels: ['A1', 'A2', 'B1'],
    color: STATUS.success,
  },
  {
    id: 'TELC',
    name: 'TELC Deutsch',
    description: 'Chứng chỉ phổ biến tại châu Âu',
    levels: ['A2', 'B1'],
    color: ACCENT.srs,
  },
];

const LEVEL_INFO: Record<string, { label: string; desc: string }> = {
  A1: { label: 'A1 — Beginner', desc: 'Giao tiếp cơ bản: chào hỏi, giới thiệu bản thân' },
  A2: { label: 'A2 — Elementary', desc: 'Hiểu và trao đổi thông tin quen thuộc' },
  B1: { label: 'B1 — Intermediate', desc: 'Giao tiếp trong công việc, du lịch, học tập' },
};

export default function StudyPlanSetup() {
  const router = useRouter();
  const createPlan = useCreateStudyPlan();

  const [step, setStep] = useState(0);
  const [examFormat, setExamFormat] = useState('');
  const [targetLevel, setTargetLevel] = useState('');
  const [examDate, setExamDate] = useState('');
  const [error, setError] = useState('');

  const selectedExam = EXAM_OPTIONS.find((e) => e.id === examFormat);

  const weeksUntilExam = examDate
    ? Math.floor((new Date(examDate).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))
    : 0;

  const minDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const handleSubmit = async () => {
    if (!examFormat || !targetLevel || !examDate) return;
    setError('');
    try {
      await createPlan.mutateAsync({ examFormat, targetLevel, examDate });
      router.push('/study-plan');
    } catch (err) {
      setError((err as Error | undefined)?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--theme-bg-primary)' }}>
      <div className="w-full max-w-lg">
        {/* Progress header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-6 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: step === i ? 40 : 8,
                  background: step === i ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)' : step > i ? ACCENT.srs : 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1" style={{ color: 'var(--theme-text-primary)' }}>
            Step {step + 1} of 3
          </div>
        </div>

        {/* Step 0: Choose exam */}
        {step === 0 && (
          <div className="space-y-6" style={{ animation: 'slideUp .4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                Lộ trình của riêng bạn
              </h1>
              <p className="text-sm font-medium px-4" style={{ color: 'var(--theme-text-muted)' }}>
                Chúng tôi sẽ cá nhân hóa lịch trình học dựa trên mục tiêu chứng chỉ của bạn.
              </p>
            </div>
 
            <div className="space-y-4">
              {EXAM_OPTIONS.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => { setExamFormat(exam.id); setTargetLevel(''); setStep(1); }}
                  className="w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 group relative overflow-hidden active:scale-[0.98]"
                  style={{
                    borderColor: examFormat === exam.id ? exam.color : 'var(--theme-border)',
                    backgroundColor: examFormat === exam.id ? `${exam.color}08` : 'var(--theme-bg-card)',
                    boxShadow: examFormat === exam.id ? `0 12px 30px ${exam.color}15` : 'none',
                  }}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg transition-transform group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${exam.color}, ${exam.color}CC)` }}
                    >
                      {exam.id[0]}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-lg tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                        {exam.name}
                      </div>
                      <div className="text-sm font-medium mt-1 opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                        {exam.description}
                      </div>
                      <div className="flex gap-2 mt-3">
                        {exam.levels.map((l) => (
                          <span
                            key={l}
                            className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider"
                            style={{ background: `${exam.color}12`, color: exam.color, border: `1px solid ${exam.color}20` }}
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={exam.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                    </div>
                  </div>
                  
                  {/* Background decoration */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03]" style={{ background: exam.color }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Choose level */}
        {step === 1 && selectedExam && (
          <div className="space-y-6" style={{ animation: 'slideUp .4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                Mục tiêu của bạn
              </h1>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                Học viên đạt trình độ {targetLevel || '...'} thường mất 2-4 tháng luyện tập.
              </p>
            </div>

            <div className="grid gap-4">
              {selectedExam.levels.map((level) => {
                const info = LEVEL_INFO[level];
                const isSelected = targetLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => { setTargetLevel(level); setStep(2); }}
                    className="w-full text-left p-6 rounded-[2rem] border-2 transition-all duration-300 relative group overflow-hidden active:scale-[0.98]"
                    style={{
                      borderColor: isSelected ? selectedExam.color : 'var(--theme-border)',
                      backgroundColor: isSelected ? `${selectedExam.color}08` : 'var(--theme-bg-card)',
                      boxShadow: isSelected ? `0 12px 30px ${selectedExam.color}15` : 'none',
                    }}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <div className="font-black text-xl tracking-tight" style={{ color: 'var(--theme-text-primary)' }}>
                          {info.label}
                        </div>
                        <div className="text-sm font-medium mt-1 opacity-70 leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>
                          {info.desc}
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-current border-transparent' : 'border-gray-200'}`} style={{ color: isSelected ? 'white' : undefined }}>
                        {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(0)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Quay lại bước trước
            </button>
          </div>
        )}

        {/* Step 2: Choose exam date */}
        {step === 2 && (
          <div className="space-y-6" style={{ animation: 'slideUp .4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="text-center">
              <h1 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                Ngày về đích
              </h1>
              <p className="text-sm font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                {examFormat} {targetLevel} — Chọn ngày bạn sẽ dự thi.
              </p>
            </div>

            <div
              className="p-8 rounded-[2.5rem] border-2 shadow-sm"
              style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
            >
              <div className="mb-6">
                <label className="block text-xs font-black uppercase tracking-widest opacity-40 mb-3" style={{ color: 'var(--theme-text-primary)' }}>
                  Dự kiến ngày thi
                </label>
                <input
                  type="date"
                  value={examDate}
                  min={minDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border-2 text-base font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  style={{
                    backgroundColor: 'var(--theme-bg-primary)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-primary)',
                  }}
                />
              </div>

              {examDate && weeksUntilExam > 0 && (
                <div className="p-5 rounded-2xl flex items-start gap-4 transition-all"
                  style={{ background: weeksUntilExam < 8 ? 'rgba(239,68,68,.05)' : 'rgba(59,130,246,.05)' }}>
                  <div className="text-2xl pt-1">
                    {weeksUntilExam < 8 ? '⚡' : '📅'}
                  </div>
                  <div>
                    <div className="font-black text-lg" style={{ color: weeksUntilExam < 8 ? STATUS.danger : ACCENT.srs }}>
                      {weeksUntilExam} tuần ôn luyện
                    </div>
                    <p className="text-sm font-medium mt-1 leading-relaxed opacity-70" style={{ color: 'var(--theme-text-muted)' }}>
                      {weeksUntilExam < 8
                        ? 'Thời gian khá gấp! Bạn cần tập trung cao độ để đạt mục tiêu.'
                        : weeksUntilExam > 24
                          ? 'Bạn có rất nhiều thời gian. Hãy học đều đặn mỗi ngày.'
                          : 'Khoảng thời gian lý tưởng để bứt phá trình độ.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-center font-bold px-4 py-3 rounded-xl bg-red-50 text-red-500 border border-red-100">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={handleSubmit}
                disabled={!examDate || weeksUntilExam < 4 || createPlan.isPending}
                className="w-full py-5 rounded-[2rem] text-white font-black text-sm tracking-widest uppercase transition-all shadow-xl disabled:opacity-40 disabled:scale-100 active:scale-95 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)', boxShadow: '0 12px 30px rgba(99,102,241,.3)' }}
              >
                {createPlan.isPending ? 'Đang tạo lộ trình...' : 'Bắt đầu ngay'}
              </button>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center py-4 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                Quay lại
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
