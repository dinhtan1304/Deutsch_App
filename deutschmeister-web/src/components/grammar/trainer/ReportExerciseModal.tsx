'use client';

import { useState } from 'react';
import { useReportExercise } from '@/hooks/useGrammarTrainer';
import { REPORT_REASONS, REPORT_REASON_LABEL, type ReportReason } from '@/lib/api/grammarTrainer';
import { useModalA11y } from '@/hooks/useModalA11y';
import { Button } from '@/components/ui';
import { STATUS } from '@/lib/tokens';
import { IconX, IconCheck } from '@/components/ui/Icons';

interface ReportExerciseModalProps {
  exerciseId: string;
  onClose: () => void;
}

export function ReportExerciseModal({ exerciseId, onClose }: ReportExerciseModalProps) {
  const dialogRef = useModalA11y(true, onClose);
  const [reason, setReason] = useState<ReportReason>('wrong_answer');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState<{ deduped: boolean } | null>(null);
  const mutation = useReportExercise();

  function submit() {
    mutation.mutate(
      { id: exerciseId, reason, note: note.trim() || undefined },
      { onSuccess: (res) => setSuccess({ deduped: res.deduped }) },
    );
  }

  const errorMessage = (mutation.error as { message?: string } | null)?.message ?? null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)', zIndex: 9000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-exercise-title"
        className="rounded-2xl max-w-md w-full p-5"
        style={{
          background: 'var(--theme-bg-card)',
          boxShadow: 'var(--shadow-lifted)',
          border: '1px solid var(--theme-border)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <h2
            id="report-exercise-title"
            className="text-lead font-bold"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Báo lỗi câu này
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
          >
            <IconX size={16} />
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <div
              className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3"
              style={{ background: 'rgba(34,197,94,.15)', color: STATUS.success }}
            >
              <IconCheck size={28} />
            </div>
            <div className="font-semibold text-lead mb-1" style={{ color: 'var(--theme-text-primary)' }}>
              Đã gửi báo lỗi
            </div>
            <p className="text-body mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              {success.deduped
                ? 'Bạn đã báo lỗi câu này rồi. Cảm ơn bạn!'
                : 'Cảm ơn bạn! Câu này sẽ được ẩn và admin sẽ kiểm tra lại.'}
            </p>
            <Button variant="primary" fullWidth onClick={onClose}>
              Đóng
            </Button>
          </div>
        ) : (
          <>
            <div
              className="text-caption uppercase font-bold tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Lý do
            </div>
            <div className="space-y-1.5 mb-4">
              {REPORT_REASONS.map((r) => {
                const sel = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: sel ? 'rgba(239,68,68,.1)' : 'var(--theme-bg-secondary)',
                      border: `1px solid ${sel ? 'rgba(239,68,68,.4)' : 'var(--theme-border)'}`,
                      color: sel ? STATUS.danger : 'var(--theme-text-primary)',
                    }}
                  >
                    <span className="font-medium text-body">{REPORT_REASON_LABEL[r]}</span>
                    {sel && <IconCheck size={14} className="ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div
              className="text-caption uppercase font-bold tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              Ghi chú (tuỳ chọn)
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mô tả lỗi bạn thấy…"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg mb-1 text-body resize-y"
              style={{
                background: 'var(--theme-bg-secondary)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text-primary)',
                minHeight: 72,
              }}
            />
            <div className="text-caption text-right mb-3" style={{ color: 'var(--theme-text-muted)' }}>
              {note.length}/500
            </div>

            {errorMessage && (
              <div
                className="rounded-lg px-3 py-2 mb-3 text-body"
                style={{
                  background: 'rgba(239,68,68,.1)',
                  border: '1px solid rgba(239,68,68,.35)',
                  color: STATUS.danger,
                }}
              >
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" fullWidth onClick={onClose}>
                Huỷ
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                isLoading={mutation.isPending}
                onClick={submit}
                style={{ background: STATUS.danger }}
              >
                Gửi báo lỗi
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
