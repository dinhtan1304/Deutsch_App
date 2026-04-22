'use client';

import { RoleplayFeedback } from '@/lib/api/roleplay';

function getScoreColor(score: number) {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  if (score >= 40) return '#F97316';
  return '#EF4444';
}

interface Props {
  feedback: RoleplayFeedback;
}

export function FeedbackSummary({ feedback }: Props) {
  const overallColor = getScoreColor(feedback.overallScore);

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div
        className="rounded-2xl border p-5 text-center"
        style={{
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-bg-card)',
        }}
      >
        <div
          className="text-5xl font-bold mb-1"
          style={{ color: overallColor }}
        >
          {feedback.overallScore}
          <span className="text-2xl opacity-60">/100</span>
        </div>
        <div className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          Điểm tổng
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Ngữ pháp', value: feedback.grammarScore },
          { label: 'Từ vựng', value: feedback.vocabScore },
          { label: 'Lưu loát', value: feedback.fluencyScore },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-3 text-center"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-card)',
            }}
          >
            <div
              className="text-xl font-bold"
              style={{ color: getScoreColor(s.value) }}
            >
              {s.value}
            </div>
            <div
              className="text-caption mt-0.5"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback text */}
      {feedback.feedbackVi && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <h4
            className="text-sm font-bold mb-2 flex items-center gap-2"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            💬 Nhận xét
          </h4>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            {feedback.feedbackVi}
          </p>
        </div>
      )}

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: '#22C55E40',
            backgroundColor: 'rgba(34,197,94,0.05)',
          }}
        >
          <h4 className="text-sm font-bold mb-2" style={{ color: '#22C55E' }}>
            ✅ Điểm mạnh
          </h4>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <span style={{ color: '#22C55E' }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {feedback.improvements?.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: '#F59E0B40',
            backgroundColor: 'rgba(245,158,11,0.05)',
          }}
        >
          <h4 className="text-sm font-bold mb-2" style={{ color: '#F59E0B' }}>
            💡 Cần cải thiện
          </h4>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                <span style={{ color: '#F59E0B' }}>•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Corrections */}
      {feedback.corrections?.length > 0 && (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-bg-card)',
          }}
        >
          <h4
            className="text-sm font-bold mb-3"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            ✏️ Sửa lỗi
          </h4>
          <div className="space-y-3">
            {feedback.corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-xl p-3"
                style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
              >
                <div className="text-xs mb-1" style={{ color: '#EF4444' }}>
                  ❌ {c.original}
                </div>
                <div className="text-xs mb-1.5" style={{ color: '#22C55E' }}>
                  ✅ {c.corrected}
                </div>
                <div
                  className="text-caption italic"
                  style={{ color: 'var(--theme-text-muted)' }}
                >
                  {c.explanationVi}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
