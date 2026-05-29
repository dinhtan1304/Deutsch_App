'use client';
/* eslint-disable no-restricted-syntax */

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Switch } from '@/components/ui';
import { IconX, IconUpload, IconCheck, IconLoader } from '@/components/ui/Icons';
import { useUpdateProfile, useUploadAvatar, useUploadCover } from '@/hooks/useUser';
import { COVER_PRESETS, DEFAULT_COVER_PRESET, PRESET_PREFIX, presetIdFromCover, isPresetCover, type CoverPresetId } from '@/lib/coverPresets';
import type { User } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const NAME_MAX = 60;
const BIO_MAX = 500;

export function ProfileEditModal({ open, onClose, user }: Props) {
  if (!open || !user) return null;
  return <ProfileEditModalInner onClose={onClose} user={user} />;
}

function ProfileEditModalInner({ onClose, user }: { onClose: () => void; user: User }) {
  const t = useTranslations('progress.profile.editModal');
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadCover = useUploadCover();

  // Initialize once per mount — modal is unmounted when closed, so reopening
  // re-runs these initializers with fresh `user`.
  const [name, setName] = useState(user.name ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(user.avatar ?? null);
  const [coverImage, setCoverImage] = useState<string | null>(user.coverImage ?? null);
  const [isPublic, setIsPublic] = useState(user.isPublic ?? false);
  const [coverTab, setCoverTab] = useState<'preset' | 'upload'>(
    isPresetCover(user.coverImage) || !user.coverImage ? 'preset' : 'upload',
  );
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ESC closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const trimmedName = name.trim();
  const trimmedBio = bio.trim();
  const nameInvalid = trimmedName.length === 0 || trimmedName.length > NAME_MAX;
  const bioInvalid = trimmedBio.length > BIO_MAX;

  const isPristine =
    trimmedName === (user.name ?? '').trim() &&
    trimmedBio === (user.bio ?? '').trim() &&
    avatar === (user.avatar ?? null) &&
    coverImage === (user.coverImage ?? null) &&
    isPublic === (user.isPublic ?? false);

  const isUploading = uploadAvatar.isPending || uploadCover.isPending;
  const canSave = !nameInvalid && !bioInvalid && !isPristine && !isUploading && !updateProfile.isPending;

  const handleAvatarFile = async (file: File) => {
    setError(null);
    try {
      const { url } = await uploadAvatar.mutateAsync(file);
      setAvatar(url);
    } catch (e) {
      setError(getApiErrorMessage(e, t('avatarUploadFailed')));
    }
  };

  const handleCoverFile = async (file: File) => {
    setError(null);
    try {
      const { url } = await uploadCover.mutateAsync(file);
      setCoverImage(url);
    } catch (e) {
      setError(getApiErrorMessage(e, t('coverUploadFailed')));
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({
        name: trimmedName,
        avatar: avatar ?? '',
        coverImage: coverImage ?? '',
        bio: trimmedBio,
        isPublic,
      });
      onClose();
    } catch (e) {
      setError(getApiErrorMessage(e, t('updateFailed')));
    }
  };

  const renderCoverPreview = () => {
    if (coverImage && !isPresetCover(coverImage)) {
      return <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />;
    }
    const presetId = presetIdFromCover(coverImage);
    const key = (presetId && presetId in COVER_PRESETS ? presetId : DEFAULT_COVER_PRESET) as CoverPresetId;
    return <div className="absolute inset-0" style={{ background: COVER_PRESETS[key] }} />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text-primary)' }}>{t('title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-theme-bg-secondary"
            style={{ color: 'var(--theme-text-secondary)' }}
            aria-label={t('close')}
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Cover preview */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}>{t('coverLabel')}</div>
            <div className="relative h-32 rounded-2xl overflow-hidden border"
              style={{ borderColor: 'var(--theme-border)' }}>
              {renderCoverPreview()}
            </div>

            {/* Cover tabs */}
            <div className="mt-3 flex gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCoverTab('preset')}
                className="px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: coverTab === 'preset' ? '#6366F1' : 'var(--theme-bg-secondary)',
                  color: coverTab === 'preset' ? '#fff' : 'var(--theme-text-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >Preset</button>
              <button
                type="button"
                onClick={() => setCoverTab('upload')}
                className="px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: coverTab === 'upload' ? '#6366F1' : 'var(--theme-bg-secondary)',
                  color: coverTab === 'upload' ? '#fff' : 'var(--theme-text-secondary)',
                  border: '1px solid var(--theme-border)',
                }}
              >{t('uploadTab')}</button>
            </div>

            {coverTab === 'preset' && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Object.entries(COVER_PRESETS).map(([id, css]) => {
                  const value = `${PRESET_PREFIX}${id}`;
                  const selected = coverImage === value || (!coverImage && id === DEFAULT_COVER_PRESET);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setCoverImage(value)}
                      className="relative h-16 rounded-xl overflow-hidden transition-transform hover:scale-105"
                      style={{ background: css, border: selected ? '3px solid #6366F1' : '1px solid var(--theme-border)' }}
                      aria-label={`Preset ${id}`}
                    >
                      {selected && (
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-indigo-600 text-white">
                          <IconCheck size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {coverTab === 'upload' && (
              <div className="mt-3">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverFile(f);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  leftIcon={uploadCover.isPending ? <IconLoader size={14} className="animate-spin" /> : <IconUpload size={14} />}
                  isLoading={uploadCover.isPending}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {uploadCover.isPending ? t('uploading') : t('chooseFile')}
                </Button>
                <p className="text-xs mt-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {t('fileHint')}
                </p>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}>{t('avatarLabel')}</div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-black"
                style={{ background: avatar ? undefined : 'linear-gradient(135deg, #4F46E5, #3730A3)' }}>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  (user.name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = '';
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                leftIcon={uploadAvatar.isPending ? <IconLoader size={14} className="animate-spin" /> : <IconUpload size={14} />}
                isLoading={uploadAvatar.isPending}
                onClick={() => avatarInputRef.current?.click()}
              >
                {uploadAvatar.isPending ? t('uploading') : t('changeAvatar')}
              </Button>
            </div>
          </div>

          {/* Name */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}>{t('nameLabel')}</div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX}
              placeholder={t('namePlaceholder')}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--theme-text-muted)' }}>
              <span>{nameInvalid && trimmedName.length === 0 ? t('nameRequired') : ''}</span>
              <span>{trimmedName.length}/{NAME_MAX}</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}>{t('bioLabel')}</div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={BIO_MAX + 50}
              rows={4}
              placeholder={t('bioPlaceholder')}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                backgroundColor: 'var(--theme-bg-body)',
                borderColor: bioInvalid ? '#EF4444' : 'var(--theme-border)',
                color: 'var(--theme-text-primary)',
              }}
            />
            <div className="flex justify-end text-xs mt-1"
              style={{ color: bioInvalid ? '#EF4444' : 'var(--theme-text-muted)' }}>
              {trimmedBio.length}/{BIO_MAX}
            </div>
          </div>

          {/* Public toggle */}
          <div className="rounded-2xl border p-4"
            style={{ backgroundColor: 'var(--theme-bg-secondary)', borderColor: 'var(--theme-border)' }}>
            <Switch
              checked={isPublic}
              onChange={setIsPublic}
              label={t('publicLabel')}
              description={t('publicDesc')}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm border"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t sticky bottom-0 z-10"
          style={{ borderColor: 'var(--theme-border)', backgroundColor: 'var(--theme-bg-card)' }}>
          <Button variant="ghost" onClick={onClose} disabled={updateProfile.isPending}>{t('cancel')}</Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!canSave}
            isLoading={updateProfile.isPending}
          >
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
