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

interface CollectionsSidebarProps {
  selectedView: string;
  statTotal: number;
  statFavorites: number;
  onSelectAll: () => void;
  onSelectFavorites: () => void;
  onSelectCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
}

export function CollectionsSidebar({
  selectedView,
  statTotal,
  statFavorites,
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

  const navItem = (
    active: boolean,
    activeColor: string,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    count: number
  ) => (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2.5 text-body font-medium transition-all text-left w-full"
      style={{
        backgroundColor: active ? `${activeColor}1A` : 'transparent',
        color: active ? activeColor : 'var(--theme-text-secondary)',
      }}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <span
        className="text-caption font-semibold px-1.5 py-0.5 rounded-full"
        style={{
          backgroundColor: active ? `${activeColor}26` : 'var(--theme-bg-secondary)',
          color: active ? activeColor : 'var(--theme-text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div
      className="hidden md:flex flex-col w-52 shrink-0 rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}
    >
      {navItem(
        selectedView === 'all', ACCENT.writing, onSelectAll,
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>,
        t('all'), statTotal
      )}

      {navItem(
        selectedView === 'favorites', ACCENT.xp, onSelectFavorites,
        <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>,
        t('favorites'), statFavorites
      )}

      {collections.length > 0 && (
        <div className="mx-3 my-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />
      )}

      {collections.map(col => (
        <div
          key={col.id}
          onClick={() => onSelectCollection(col.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectCollection(col.id); }}
          className="group flex items-center gap-2.5 px-3.5 py-2.5 text-body font-medium transition-all text-left cursor-pointer"
          style={{
            backgroundColor: selectedView === col.id ? `${col.color}18` : 'transparent',
            color: selectedView === col.id ? col.color : 'var(--theme-text-secondary)',
          }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={col.color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="flex-1 truncate">{col.name}</span>
          <span
            className="text-caption font-semibold px-1.5 py-0.5 rounded-full shrink-0"
            style={{
              backgroundColor: selectedView === col.id ? `${col.color}22` : 'var(--theme-bg-secondary)',
              color: selectedView === col.id ? col.color : 'var(--theme-text-muted)',
            }}
          >
            {col.wordCount}
          </span>
          <button
            onClick={e => handleDelete(col.id, e)}
            className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-red-500 shrink-0"
            title={t('deleteTitle')}
          >
            <IconX size={12} />
          </button>
        </div>
      ))}

      <div className="mx-3 my-1 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />

      {showNew ? (
        <div className="px-3 py-2">
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
          className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <IconPlus size={13} /> {tp('createNew')}
        </button>
      )}
    </div>
  );
}
