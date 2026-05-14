'use client';

import { ComponentType, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { arenaApi } from '@/lib/api/arena';
import type {
  ArenaMode,
  ArenaRoomVisibility,
  CefrLevel,
} from '@/types/arena-events.types';
import { useSettingsStore } from '@/stores/settingsStore';
import { Card, Button, BetaBadge } from '@/components/ui';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import {
  IconGlobe,
  IconLink,
  IconLock,
  IconZap,
  IconCheck,
  IconLogIn,
} from '@/components/ui/Icons';

const MODES: { key: ArenaMode; label: string; sub: string }[] = [
  { key: 'mixed', label: 'Hỗn hợp', sub: 'Xen kẽ Việt↔Đức mỗi vòng' },
  { key: 'vi_to_de', label: 'Việt → Đức', sub: 'Đoán từ tiếng Đức' },
  { key: 'de_to_vi', label: 'Đức → Việt', sub: 'Đoán nghĩa tiếng Việt' },
];

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

type VisibilityIcon = ComponentType<{ size?: number; className?: string }>;
const VISIBILITIES: {
  key: ArenaRoomVisibility;
  label: string;
  sub: string;
  Icon: VisibilityIcon;
}[] = [
  { key: 'public', label: 'Công khai', sub: 'Hiện trong danh sách, ai cũng vào được', Icon: IconGlobe },
  { key: 'link', label: 'Chỉ có link', sub: 'Không hiển thị danh sách, gửi link cho bạn', Icon: IconLink },
  { key: 'password', label: 'Có mật khẩu', sub: 'Cần link + mật khẩu để vào', Icon: IconLock },
];

export default function CreateArenaRoomPage() {
  const router = useRouter();
  const preferredLevel = useSettingsStore((s) => s.settings.preferredLevel);
  // 'all' is a learning-filter option, not a CEFR target — fall back to B1.
  const defaultLevel: CefrLevel = preferredLevel === 'all' ? 'B1' : preferredLevel;
  const [mode, setMode] = useState<ArenaMode>('mixed');
  const [level, setLevel] = useState<CefrLevel>(defaultLevel);
  const [visibility, setVisibility] = useState<ArenaRoomVisibility>('public');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !submitting && (visibility !== 'password' || password.trim().length >= 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await arenaApi.createRoom({
        mode,
        level,
        visibility,
        password: visibility === 'password' ? password : undefined,
        name: name.trim() || undefined,
      });
      router.push(`/arena/rooms/${res.inviteCode}`);
    } catch (err) {
      const e = err as { body?: { code?: string }; code?: string; message?: string };
      const code = e?.body?.code ?? e?.code;
      if (code === 'ALREADY_QUEUED') {
        setError('Bạn đang trong hàng chờ tự động. Hãy hủy trước khi tạo phòng.');
      } else if (code === 'ALREADY_OWNS_ROOM') {
        setError('Bạn đang có một phòng đang chờ. Vào lại phòng đó hoặc hủy nó trước.');
      } else {
        setError(e?.message ?? 'Không thể tạo phòng. Vui lòng thử lại.');
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>
            Tạo phòng đấu
          </h1>
          <BetaBadge size="md" />
        </div>
        <Link href="/arena">
          <Button variant="outline">← Sảnh</Button>
        </Link>
      </div>

      <div
        className="rounded-xl px-4 py-3 mb-4 text-caption flex items-start gap-2"
        style={{
          background: 'rgba(245,158,11,.1)',
          border: '1px solid rgba(245,158,11,.3)',
          color: ACCENT.xp,
        }}
      >
        <IconZap size={16} className="shrink-0 mt-0.5" />
        <span>
          Trận trong phòng tự tạo là <strong>trận giao hữu</strong> — không ảnh hưởng tới xếp hạng (rating). Bạn vẫn nhận XP.
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mode */}
        <Section title="Chế độ chơi">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MODES.map((m) => {
              const sel = mode === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className="text-left rounded-xl p-3"
                  style={{
                    background: sel ? GRADIENT.vocab : 'var(--theme-bg-card)',
                    color: sel ? '#fff' : 'var(--theme-text-primary)',
                    border: `1px solid ${sel ? 'transparent' : 'var(--theme-border)'}`,
                  }}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div
                    className="text-caption mt-0.5"
                    style={{ color: sel ? 'rgba(255,255,255,.8)' : 'var(--theme-text-muted)' }}
                  >
                    {m.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Level */}
        <Section title="Trình độ (CEFR)">
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((lv) => {
              const sel = level === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setLevel(lv)}
                  className="px-4 py-2 rounded-lg font-bold text-body"
                  style={{
                    background: sel ? GRADIENT.vocab : 'var(--theme-bg-card)',
                    color: sel ? '#fff' : 'var(--theme-text-secondary)',
                    border: `1px solid ${sel ? 'transparent' : 'var(--theme-border)'}`,
                  }}
                >
                  {lv}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Visibility */}
        <Section title="Quyền riêng tư">
          <div className="space-y-2">
            {VISIBILITIES.map((v) => {
              const sel = visibility === v.key;
              const Icon = v.Icon;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVisibility(v.key)}
                  className="w-full text-left rounded-xl p-3 flex items-center gap-3"
                  style={{
                    background: sel ? 'rgba(139,92,246,.12)' : 'var(--theme-bg-card)',
                    border: `1px solid ${sel ? 'rgba(139,92,246,.45)' : 'var(--theme-border)'}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: sel ? 'rgba(139,92,246,.18)' : 'var(--theme-bg-secondary)',
                      color: sel ? ACCENT.vocab : 'var(--theme-text-secondary)',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="font-semibold"
                      style={{ color: sel ? ACCENT.vocab : 'var(--theme-text-primary)' }}
                    >
                      {v.label}
                    </div>
                    <div className="text-caption" style={{ color: 'var(--theme-text-muted)' }}>
                      {v.sub}
                    </div>
                  </div>
                  {sel && (
                    <span
                      aria-hidden="true"
                      style={{ color: ACCENT.vocab, display: 'inline-flex' }}
                    >
                      <IconCheck size={18} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {visibility === 'password' && (
            <div className="mt-3">
              <label
                className="text-caption font-semibold mb-1 block"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Mật khẩu phòng
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="vd: deutsch2025"
                maxLength={32}
                className="w-full px-3 py-2 rounded-lg"
                style={{
                  background: 'var(--theme-bg-card)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                }}
              />
              <div className="text-caption mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                Bạn sẽ chia sẻ mật khẩu cùng với link để bạn bè vào phòng.
              </div>
            </div>
          )}
        </Section>

        {/* Optional name */}
        <Section title="Tên phòng (tuỳ chọn)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vd: Phòng của Tân"
            maxLength={60}
            className="w-full px-3 py-2 rounded-lg"
            style={{
              background: 'var(--theme-bg-card)',
              border: '1px solid var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
          />
        </Section>

        {error && (
          <div
            className="rounded-xl px-3 py-2 mb-3 text-body"
            style={{
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.35)',
              color: STATUS.danger,
            }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          isLoading={submitting}
          style={{ background: GRADIENT.vocab }}
        >
          <span className="inline-flex items-center gap-2">
            <IconLogIn size={18} />
            <span>Tạo phòng</span>
          </span>
        </Button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="mb-3">
      <div
        className="text-caption font-bold uppercase tracking-wider mb-2"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        {title}
      </div>
      {children}
    </Card>
  );
}
