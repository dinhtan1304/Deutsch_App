'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Button, Card, Input, PageHeader } from '@/components/ui';
import { useCreateUserTopic } from '@/hooks/useUserTopics';
import { createSet as createSetApi } from '@/lib/api/user-topics';
import { ACCENT } from '@/lib/tokens';
import type { CreateUserTopicDto } from '@/types/user-topic';
import { getApiErrorMessage } from '@/lib/api/client';

const COVER_COLORS = [
  ACCENT.vocab,
  ACCENT.reading,
  ACCENT.xp,
  ACCENT.listening,
  ACCENT.examWriting,
  ACCENT.cyan,
  ACCENT.speaking,
];
const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;

export default function NewUserTopicPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<string>('A1');
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0]);
  const [firstSetTitle, setFirstSetTitle] = useState('Bộ thẻ #1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createTopic = useCreateUserTopic();
  const submittingRef = useRef(false);

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề.');
      submittingRef.current = false;
      return;
    }
    setBusy(true);
    try {
      const dto: CreateUserTopicDto = {
        title: title.trim(),
        description: description.trim() || undefined,
        level,
        coverColor,
      };
      const topic = await createTopic.mutateAsync(dto);
      if (firstSetTitle.trim()) {
        await createSetApi(topic.id, { title: firstSetTitle.trim() });
      }
      router.push(`/my-topics/${topic.id}`);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Không tạo được bộ chủ đề'));
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        backHref="/my-topics"
        hideBackIcon
        title="Tạo bộ chủ đề mới"
        subtitle="Đặt tên, chọn cấp độ và bộ thẻ đầu tiên. Sau đó bạn có thể thêm từ ở bước tiếp theo."
        accent="vocab"
      />

      <Card variant="default" className="space-y-5" style={{ border: '1px solid var(--theme-border)' }}>
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Tiêu đề <span style={{ color: ACCENT.speaking }}>*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Từ vựng nhà hàng và món ăn"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Mô tả (tùy chọn)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về bộ chủ đề..."
            maxLength={1000}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500"
            style={{
              backgroundColor: 'var(--theme-bg-secondary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Cấp độ
          </label>
          <div className="flex gap-2">
            {LEVELS.map((item) => (
              <button
                key={item}
                onClick={() => setLevel(item)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: level === item ? ACCENT.vocab : 'var(--theme-bg-secondary)',
                  color: level === item ? 'white' : 'var(--theme-text-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Màu chủ đạo
          </label>
          <div className="flex gap-2">
            {COVER_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setCoverColor(color)}
                className="w-9 h-9 rounded-full transition-all"
                style={{
                  backgroundColor: color,
                  outline:
                    coverColor === color ? `3px solid var(--theme-bg-card)` : 'none',
                  boxShadow: coverColor === color ? `0 0 0 2px ${color}` : 'none',
                }}
                aria-label={`Chọn màu ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="pt-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
            Tên bộ thẻ đầu tiên
          </label>
          <Input
            value={firstSetTitle}
            onChange={(e) => setFirstSetTitle(e.target.value)}
            placeholder="VD: Đồ ăn cơ bản"
            maxLength={120}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Bạn có thể thêm nhiều bộ thẻ và thẻ ở bước tiếp theo.
          </p>
        </div>

        {error && (
          <div
            className="px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: `${ACCENT.speaking}18`, color: ACCENT.speaking }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={() => router.push('/my-topics')}>
            Hủy
          </Button>
          <Button
            variant="game"
            accent="vocab"
            isLoading={busy}
            disabled={busy}
            onClick={handleSubmit}
          >
            Tạo và tiếp tục
          </Button>
        </div>
      </Card>

      <p className="text-xs mt-4 text-center" style={{ color: 'var(--theme-text-muted)' }}>
        Bộ chủ đề mới sẽ ở chế độ <strong>Riêng tư</strong> cho đến khi bạn chuyển sang Có link hoặc Công khai.
      </p>
    </div>
  );
}
