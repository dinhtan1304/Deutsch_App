'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateStudyPlan } from '@/hooks/useStudyPlan';

const EXAM_OPTIONS = [
  {
    id: 'GOETHE',
    name: 'Goethe-Zertifikat',
    description: 'Chứng chỉ uy tín nhất của Viện Goethe',
    levels: ['A1', 'A2', 'B1'],
    color: '#22C55E',
  },
  {
    id: 'TELC',
    name: 'TELC Deutsch',
    description: 'Chứng chỉ phổ biến tại châu Âu',
    levels: ['A2', 'B1'],
    color: '#3B82F6',
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
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--theme-bg-primary)' }}>
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: step === i ? 32 : 8,
                background: step >= i ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : 'var(--theme-border)',
              }}
            />
          ))}
        </div>

        {/* Step 0: Choose exam */}
        {step === 0 && (
          <div className="space-y-4" style={{ animation: 'fadeIn .3s ease-out' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Bạn muốn thi chứng chỉ nào?
              </h1>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                Chọn kỳ thi để chúng tôi tạo lịch học phù hợp
              </p>
            </div>

            <div className="space-y-3">
              {EXAM_OPTIONS.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => { setExamFormat(exam.id); setTargetLevel(''); setStep(1); }}
                  className="w-full text-left p-5 rounded-2xl border transition-all duration-200"
                  style={{
                    borderColor: examFormat === exam.id ? exam.color : 'var(--theme-border)',
                    backgroundColor: examFormat === exam.id ? `${exam.color}10` : 'var(--theme-bg-card)',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                      style={{ background: `linear-gradient(135deg, ${exam.color}, ${exam.color}CC)` }}
                    >
                      {exam.id[0]}
                    </div>
                    <div>
                      <div className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>
                        {exam.name}
                      </div>
                      <div className="text-body mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                        {exam.description}
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {exam.levels.map((l) => (
                          <span
                            key={l}
                            className="px-2 py-0.5 rounded text-caption font-semibold"
                            style={{ background: `${exam.color}15`, color: exam.color }}
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Choose level */}
        {step === 1 && selectedExam && (
          <div className="space-y-4" style={{ animation: 'fadeIn .3s ease-out' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Chọn trình độ mục tiêu
              </h1>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {selectedExam.name} — Trình độ bạn muốn đạt
              </p>
            </div>

            <div className="space-y-3">
              {selectedExam.levels.map((level) => {
                const info = LEVEL_INFO[level];
                return (
                  <button
                    key={level}
                    onClick={() => { setTargetLevel(level); setStep(2); }}
                    className="w-full text-left p-5 rounded-2xl border transition-all duration-200"
                    style={{
                      borderColor: targetLevel === level ? selectedExam.color : 'var(--theme-border)',
                      backgroundColor: targetLevel === level ? `${selectedExam.color}10` : 'var(--theme-bg-card)',
                    }}
                  >
                    <div className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>
                      {info.label}
                    </div>
                    <div className="text-body mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                      {info.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(0)}
              className="w-full text-center py-3 text-sm font-medium rounded-xl mt-2"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Quay lại
            </button>
          </div>
        )}

        {/* Step 2: Choose exam date */}
        {step === 2 && (
          <div className="space-y-4" style={{ animation: 'fadeIn .3s ease-out' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-text-primary)' }}>
                Ngày thi dự kiến
              </h1>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                {examFormat} {targetLevel} — Chọn ngày thi để tính lịch học
              </p>
            </div>

            <div
              className="p-5 rounded-2xl border"
              style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                Ngày thi
              </label>
              <input
                type="date"
                value={examDate}
                min={minDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{
                  backgroundColor: 'var(--theme-bg-primary)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />

              {examDate && weeksUntilExam > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <div
                    className="px-3 py-1.5 rounded-lg text-sm font-bold"
                    style={{
                      background: weeksUntilExam < 8 ? 'rgba(239,68,68,.1)' : 'rgba(59,130,246,.1)',
                      color: weeksUntilExam < 8 ? '#EF4444' : '#3B82F6',
                    }}
                  >
                    {weeksUntilExam} tuần
                  </div>
                  <span className="text-body" style={{ color: 'var(--theme-text-muted)' }}>
                    {weeksUntilExam < 8
                      ? 'Thời gian hơi gấp — hãy học chăm chỉ!'
                      : weeksUntilExam > 24
                        ? 'Thời gian dư dả — hãy học đều đặn!'
                        : 'Thời gian lý tưởng để ôn luyện!'}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-center font-medium" style={{ color: '#EF4444' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!examDate || weeksUntilExam < 4 || createPlan.isPending}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
            >
              {createPlan.isPending ? 'Đang tạo...' : 'Tạo lịch học'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full text-center py-3 text-sm font-medium rounded-xl"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Quay lại
            </button>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
