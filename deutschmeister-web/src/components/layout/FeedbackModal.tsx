'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useRef, useCallback } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { useMutation } from '@tanstack/react-query';
import { feedbackApi, FeedbackType } from '@/lib/api/feedback';
import { IconX, IconBug, IconLightbulb, IconMessageCircle, IconCheck, IconLoader } from '@/components/ui/Icons';
import { useModalA11y } from '@/hooks/useModalA11y';

interface FeedbackModalProps {
  onClose: () => void;
}

const MAX_IMAGES = 3;
const MAX_SIZE_MB = 2;

const TYPES: { value: FeedbackType; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }[] = [
  { value: 'bug',        label: 'Báo cáo lỗi',  icon: IconBug,           color: STATUS.danger, bg: 'rgba(239,68,68,.12)'  },
  { value: 'suggestion', label: 'Góp ý / Đề xuất', icon: IconLightbulb,  color: ACCENT.xp, bg: 'rgba(245,158,11,.12)' },
  { value: 'other',      label: 'Khác',          icon: IconMessageCircle, color: ACCENT.writing, bg: 'rgba(99,102,241,.12)' },
];

/** Compress image to JPEG, max 1200px wide, quality 0.7 → base64 data URI */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Inline Icons ────────────────────────────────────────────────────────────
function IconCamera({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const dialogRef = useModalA11y(true, onClose);
  const [type, setType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imgError, setImgError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => feedbackApi.submit({
      type,
      content: content.trim(),
      pageUrl: typeof window !== 'undefined' ? window.location.pathname : undefined,
      imageUrls: images.length > 0 ? images : undefined,
    }),
    onSuccess: () => setSubmitted(true),
  });

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setImgError('');

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setImgError(`Tối đa ${MAX_IMAGES} ảnh`);
      return;
    }

    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {
      if (!file.type.startsWith('image/')) {
        setImgError('Chỉ chấp nhận file ảnh');
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setImgError(`Ảnh tối đa ${MAX_SIZE_MB}MB`);
        continue;
      }
      try {
        const dataUri = await compressImage(file);
        setImages(prev => [...prev, dataUri]);
      } catch {
        setImgError('Không thể xử lý ảnh');
      }
    }
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImgError('');
  };

  const canSubmit = content.trim().length >= 10 && !isPending;
  const selected = TYPES.find(t => t.value === type)!;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
        className="fixed z-50 bottom-6 right-6 w-90 rounded-2xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--theme-border)' }}>
          <div>
            <p id="feedback-modal-title" className="font-bold text-[15px]" style={{ color: 'var(--theme-text-primary)' }}>Phản hồi</p>
            <p className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>Giúp chúng tôi cải thiện DeutschMeister</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
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
              className="mt-5 px-5 py-2 rounded-xl text-body font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              Đóng
            </button>
          </div>
        ) : (
          <div className="p-5 overflow-y-auto">
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
                    <span className="text-caption font-semibold leading-tight"
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
              className="w-full rounded-xl border px-4 py-3 text-body resize-none focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: 'var(--theme-bg-secondary)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
                '--tw-ring-color': selected.color,
              } as React.CSSProperties}
            />
            <p className="text-caption mt-1 text-right" style={{ color: content.trim().length < 10 ? STATUS.danger : 'var(--theme-text-muted)' }}>
              {content.trim().length}/10 ký tự tối thiểu
            </p>

            {/* Image upload */}
            <div className="mt-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { handleFiles(e.target.files); e.target.value = ''; }}
              />

              {/* Image previews */}
              {images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {images.map((src, i) => (
                    <div key={i} className="relative group" style={{ width: 72, height: 72 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Ảnh ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                        style={{ borderColor: 'var(--theme-border)' }}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-caption font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: STATUS.danger }}
                      >
                        <IconX size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add image button */}
              {images.length < MAX_IMAGES && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors"
                  style={{
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text-secondary)',
                    borderStyle: 'dashed',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = selected.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--theme-border)')}
                >
                  <IconCamera size={14} />
                  Thêm ảnh chụp màn hình ({images.length}/{MAX_IMAGES})
                </button>
              )}

              {imgError && (
                <p className="text-caption mt-1" style={{ color: STATUS.danger }}>{imgError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={() => mutate()}
              disabled={!canSubmit}
              className="w-full mt-3 py-2.5 rounded-xl text-body font-bold text-white flex items-center justify-center gap-2 transition-all"
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
