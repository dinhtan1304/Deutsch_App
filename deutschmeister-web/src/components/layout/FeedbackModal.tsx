'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { feedbackApi, FeedbackType } from '@/lib/api/feedback';
import { IconX, IconBug, IconLightbulb, IconMessageCircle, IconCheck, IconLoader } from '@/components/ui/Icons';

interface FeedbackModalProps {
  onClose: () => void;
}

const TYPES: { value: FeedbackType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }[] = [
  { value: 'bug',        label: 'Báo cáo lỗi',  icon: IconBug,           color: '#EF4444', bg: 'rgba(239,68,68,.12)'  },
  { value: 'suggestion', label: 'Góp ý / Đề xuất', icon: IconLightbulb,  color: '#F59E0B', bg: 'rgba(245,158,11,.12)' },
  { value: 'other',      label: 'Khác',          icon: IconMessageCircle, color: '#6366F1', bg: 'rgba(99,102,241,.12)' },
];

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => feedbackApi.submit({
      type,
      content: content.trim(),
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }),
    onSuccess: () => setSubmitted(true),
  });

  const canSubmit = content.trim().length >= 10 && !isPending;
  const selected = TYPES.find(t => t.value === type)!;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="fixed z-50 bottom-6 right-6 w-[360px] rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <p className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>Phản hồi</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>Giúp chúng tôi cải thiện DeutschMeister</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--theme-text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--theme-bg-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
          >
            <IconX size={15} />
          </button>
        </div>

        {submitted ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'rgba(34,197,94,.15)' }}>
              <IconCheck size={28} className="text-green-400" />
            </div>
            <p className="font-bold text-[15px] mb-1" style={{ color: 'var(--theme-text-primary)' }}>Cảm ơn bạn!</p>
            <p className="text-[12.5px]" style={{ color: 'var(--theme-text-muted)' }}>
              Phản hồi của bạn đã được ghi nhận và sẽ giúp chúng tôi cải thiện ứng dụng.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-5 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Type selector */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = type === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-150 text-center"
                    style={{
                      borderColor: active ? t.color : 'var(--theme-border)',
                      backgroundColor: active ? t.bg : 'transparent',
                    }}
                  >
                    <span style={{ color: active ? t.color : 'var(--theme-text-muted)', display: 'flex' }}><Icon size={17} /></span>
                    <span className="text-[11px] font-semibold leading-tight"
                      style={{ color: active ? t.color : 'var(--theme-text-secondary)' }}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
              placeholder={
                type === 'bug'
                  ? 'Mô tả lỗi bạn gặp phải — xảy ra ở đâu, làm gì thì bị lỗi...'
                  : type === 'suggestion'
                  ? 'Bạn muốn thêm tính năng gì hoặc cải thiện điều gì...'
                  : 'Chia sẻ suy nghĩ của bạn về ứng dụng...'
              }
              className="w-full rounded-xl border px-4 py-3 text-[13px] resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
                '--tw-ring-color': selected.color,
              } as React.CSSProperties}
            />
            <p className="text-[11px] mt-1 text-right" style={{ color: content.trim().length < 10 ? '#EF4444' : 'var(--theme-text-muted)' }}>
              {content.trim().length}/10 ký tự tối thiểu
            </p>

            {/* Submit */}
            <button
              onClick={() => mutate()}
              disabled={!canSubmit}
              className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: canSubmit ? `linear-gradient(135deg, ${selected.color}, ${selected.color}cc)` : 'rgba(255,255,255,.1)',
                color: canSubmit ? '#fff' : 'var(--theme-text-muted)',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
              }}
            >
              {isPending ? <IconLoader size={15} className="animate-spin" /> : null}
              {isPending ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
