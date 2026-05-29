'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { STATUS, GRADIENT } from '@/lib/tokens';
import { useCollections, useCreateCollection, useAddToCollection, useRemoveFromCollection, useWordCollections } from '@/hooks/usePersonalWords';
import { IconCheck, IconPlus, IconX } from '@/components/ui/Icons';

interface AddToCollectionPickerProps {
  personalWordId: string;
  onClose: () => void;
}

export function AddToCollectionPicker({ personalWordId, onClose }: AddToCollectionPickerProps) {
  const t = useTranslations('vocabulary.wordBank.collectionPicker');
  const ref = useRef<HTMLDivElement>(null);
  const { data: collections = [] } = useCollections();
  const { data: wordCollections = [] } = useWordCollections(personalWordId);
  const addMutation = useAddToCollection();
  const removeMutation = useRemoveFromCollection();
  const createCollection = useCreateCollection();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const wordCollectionIds = new Set(wordCollections.map(c => c.id));

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const toggle = (colId: string) => {
    if (wordCollectionIds.has(colId)) {
      removeMutation.mutate({ collectionId: colId, personalWordId });
    } else {
      addMutation.mutate({ collectionId: colId, personalWordId });
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      setCreateError(null);
      const col = await createCollection.mutateAsync({ name });
      setNewName('');
      setShowCreate(false);
      // Auto-add the word to the newly created collection
      addMutation.mutate({ collectionId: col.id, personalWordId });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } } | undefined)?.response?.data?.message || (err as Error | undefined)?.message || '';
      setCreateError(msg.includes('Conflict') || msg.includes('duplicate') || msg.includes('exists')
        ? t('nameExists')
        : t('createFailed'));
    }
  };

  return (
    <div ref={ref}
      className="z-50 w-56 rounded-xl border shadow-xl overflow-hidden"
      style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid var(--theme-border)' }}>
        <p className="text-caption font-semibold uppercase tracking-wide"
          style={{ color: 'var(--theme-text-muted)' }}>
          {t('saveToFolder')}
        </p>
        <button onClick={onClose} className="p-0.5 rounded hover:opacity-70 transition-opacity"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconX size={12} />
        </button>
      </div>

      {/* Collection list */}
      <div className="max-h-40 overflow-y-auto">
        {collections.length === 0 && !showCreate ? (
          <p className="px-3 py-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {t('noFolders')}
          </p>
        ) : (
          collections.map(col => {
            const checked = wordCollectionIds.has(col.id);
            const isPending = addMutation.isPending || removeMutation.isPending;
            return (
              <button key={col.id}
                onClick={() => !isPending && toggle(col.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all text-left hover:opacity-80"
                style={{ color: 'var(--theme-text-primary)' }}>
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: checked ? col.color : 'transparent',
                    borderColor: checked ? col.color : 'var(--theme-border)',
                  }}>
                  {checked && <IconCheck size={10} className="text-white" />}
                </div>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={col.color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                <span className="flex-1 truncate">{col.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Divider */}
      <div className="mx-2 h-px" style={{ backgroundColor: 'var(--theme-border)' }} />

      {/* Create new */}
      {showCreate ? (
        <div className="px-2.5 py-2">
          <input
            autoFocus
            value={newName}
            onChange={e => { setNewName(e.target.value); setCreateError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setShowCreate(false); setNewName(''); setCreateError(null); }
            }}
            placeholder={t('namePlaceholder')}
            maxLength={50}
            className="w-full px-2 py-1.5 rounded-lg border text-caption focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            style={{
              borderColor: 'var(--theme-border)',
              backgroundColor: 'var(--theme-bg-secondary)',
              color: 'var(--theme-text-primary)',
            }}
          />
          {createError && (
            <p className="text-caption mt-0.5 px-0.5" style={{ color: STATUS.danger }}>{createError}</p>
          )}
          <div className="flex gap-1.5 mt-1.5">
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || createCollection.isPending}
              className="flex-1 py-1 rounded-lg text-caption font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: GRADIENT.writing }}>
              {t('create')}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); setCreateError(null); }}
              className="px-2 py-1 rounded-lg text-caption transition-all"
              style={{ backgroundColor: 'var(--theme-bg-secondary)', color: 'var(--theme-text-muted)' }}>
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-caption font-medium transition-all hover:opacity-80"
          style={{ color: 'var(--theme-text-muted)' }}>
          <IconPlus size={11} /> {t('createNew')}
        </button>
      )}

      {/* Done button */}
      <div className="px-2.5 pb-2">
        <button onClick={onClose}
          className="w-full py-1.5 rounded-lg text-caption font-semibold transition-all hover:opacity-80"
          style={{
            backgroundColor: 'var(--theme-bg-secondary)',
            color: 'var(--theme-text-primary)',
            border: '1px solid var(--theme-border)',
          }}>
          {t('done')}
        </button>
      </div>
    </div>
  );
}
