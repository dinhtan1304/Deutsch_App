'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ACCENT, STATUS, GRADIENT } from '@/lib/tokens';
import { IconX, IconPlus } from '@/components/ui/Icons';
import {
  useCollections,
  useCreateCollection,
  useDeleteCollection,
} from '@/hooks/usePersonalWords';
import type { SRSStats } from '@/lib/api/personal-words';

interface CollectionsSidebarProps {
  selectedView: string;
  statTotal: number;
  statFavorites: number;
  srsStats?: SRSStats;
  onSelectAll: () => void;
  onSelectFavorites: () => void;
  onSelectCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export function CollectionsSidebar({
  selectedView,
  statTotal,
  statFavorites,
  srsStats,
  onSelectAll,
  onSelectFavorites,
  onSelectCollection,
  onDeleteCollection,
}: CollectionsSidebarProps) {
  const t = useTranslations('vocabulary.wordBank.collectionsSidebar');
  const tp = useTranslations('vocabulary.wordBank.collectionPicker');
  const { data: collections = [] } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      setError(null);
      await createCollection.mutateAsync({ name });
      setNewName('');
      setShowNew(false);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err as Error | undefined)?.message ?? '';
      setError(
        msg.includes('Conflict') || msg.includes('duplicate') || msg.includes('exists')
          ? t('nameExists')
          : t('createFailed')
      );
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t('deleteConfirm'))) return;
    onDeleteCollection(id);
    await deleteCollection.mutateAsync(id);
  };

  // v2 folder item — neutral active (raised bg-secondary), colored dot/icon.
  const navItem = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    count: number
  ) => (
    <button
      onClick={onClick}
      className="sb-nav-link flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body text-left w-full"
      style={{
        backgroundColor: active ? 'var(--theme-bg-secondary)' : 'transparent',
        color: active ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
        fontWeight: active ? 600 : 500,
      }}
    >
      <span className="shrink-0 flex">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      <span className="mono text-caption shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{count}</span>
    </button>
  );

  const cardStyle: React.CSSProperties = { borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' };

  return (
    <div className="hidden md:flex flex-col gap-1.5 w-55 shrink-0">

      {/* System folders */}
      <div className="rounded-xl border p-2 flex flex-col gap-0.5" style={cardStyle}>
        {navItem(
          selectedView === 'all', onSelectAll,
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>,
          t('all'), statTotal
        )}
        {navItem(
          selectedView === 'favorites', onSelectFavorites,
          <svg width={15} height={15} viewBox="0 0 24 24" fill={ACCENT.xp} stroke={ACCENT.xp} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>,
          t('favorites'), statFavorites
        )}
      </div>

      {/* User folders */}
      <div className="rounded-xl border p-2 flex flex-col gap-0.5" style={cardStyle}>
        <div className="flex items-center justify-between px-2.5 pt-1 pb-1.5 text-caption font-semibold uppercase" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>
          {t('myFolders')}
          <span className="mono font-medium">{collections.length}</span>
        </div>

        {collections.map(col => (
          <div
            key={col.id}
            onClick={() => onSelectCollection(col.id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectCollection(col.id); }}
            className="sb-nav-link group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-body text-left cursor-pointer"
            style={{
              backgroundColor: selectedView === col.id ? 'var(--theme-bg-secondary)' : 'transparent',
              color: selectedView === col.id ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)',
              fontWeight: selectedView === col.id ? 600 : 500,
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color || 'var(--accent)' }} />
            <span className="flex-1 truncate">{col.name}</span>
            <span className="mono text-caption shrink-0" style={{ color: 'var(--theme-text-muted)' }}>{col.wordCount}</span>
            <button
              onClick={e => handleDelete(col.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 shrink-0"
              style={{ color: 'var(--theme-text-muted)' }}
              title={t('deleteTitle')}
            >
              <IconX size={12} />
            </button>
          </div>
        ))}

      {showNew ? (
        <div className="px-1 py-1">
          <input
            autoFocus
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowNew(false); setNewName(''); }
            }}
            placeholder={tp('namePlaceholder')}
            maxLength={50}
            className="w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-primary)',
            }}
          />
          {error && <p className="text-caption mt-1 px-0.5" style={{ color: STATUS.danger }}>{error}</p>}
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || createCollection.isPending}
              className="flex-1 py-1 rounded-lg text-caption font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: GRADIENT.writing }}
            >
              {tp('create')}
            </button>
            <button
              onClick={() => { setShowNew(false); setNewName(''); setError(null); }}
              className="px-2 py-1 rounded-lg text-caption transition-all"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}
            >
              {tp('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="sb-nav-link flex items-center gap-2 px-2.5 py-2 mt-0.5 rounded-lg text-xs font-medium text-left"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <IconPlus size={13} /> {tp('createNew')}
        </button>
      )}
      </div>

      {/* Overview (SRS breakdown) */}
      {srsStats && srsStats.total > 0 && (
        <div className="rounded-xl border p-3.5" style={cardStyle}>
          <div className="text-caption font-semibold uppercase mb-2.5" style={{ color: 'var(--theme-text-muted)', letterSpacing: '.06em' }}>
            {t('overview')}
          </div>
          <div className="flex flex-col gap-2">
            <MiniStat color="var(--m-learned)" label={t('ovLearned')} value={srsStats.mature} total={srsStats.total} />
            <MiniStat color="var(--m-learning)" label={t('ovLearning')} value={srsStats.learning} total={srsStats.total} />
            <MiniStat color="var(--m-new)" label={t('ovNew')} value={srsStats.new} total={srsStats.total} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-caption" style={{ color: 'var(--theme-text-secondary)' }}>{label}</span>
        <span className="mono text-caption font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{value}</span>
      </div>
      <div className="h-0.75 rounded-full overflow-hidden" style={{ background: 'var(--theme-bg-secondary)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
