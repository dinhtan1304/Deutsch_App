'use client';

import { ComponentType, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { abuseReportsApi, type AbuseContext, type AbuseReason } from '@/lib/api/abuseReports';
import { useModalA11y } from '@/hooks/useModalA11y';
import { Button } from '@/components/ui';
import { ACCENT, STATUS } from '@/lib/tokens';
import {
  IconX,
  IconCheck,
  IconShieldCheck,
  IconMessageCircle,
  IconZap,
  IconLightbulb,
  IconFlame,
} from '@/components/ui/Icons';

interface ReportUserModalProps {
  reportedUserId: string;
  reportedUserName?: string | null;
  context: AbuseContext;
  contextId?: string;
  onClose: () => void;
}

type ReasonIcon = ComponentType<{ size?: number; className?: string }>;
const REASONS: { value: AbuseReason; labelKey: string; Icon: ReasonIcon }[] = [
  { value: 'harassment',    labelKey: 'reasonHarassment',    Icon: IconFlame        },
  { value: 'cheating',      labelKey: 'reasonCheating',      Icon: IconShieldCheck       },
  { value: 'inappropriate', labelKey: 'reasonInappropriate', Icon: IconZap          },
  { value: 'spam',          labelKey: 'reasonSpam',          Icon: IconLightbulb    },
  { value: 'other',         labelKey: 'reasonOther',         Icon: IconMessageCircle },
];

export function ReportUserModal({
  reportedUserId,
  reportedUserName,
  context,
  contextId,
  onClose,
}: ReportUserModalProps) {
  const t = useTranslations('common.reportModal');
  const dialogRef = useModalA11y(true, onClose);
  const [reason, setReason] = useState<AbuseReason>('harassment');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState<{ deduped: boolean } | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      abuseReportsApi.create({
        reportedUserId,
        context,
        contextId,
        reason,
        description: description.trim() || undefined,
      }),
    onSuccess: (res) => setSuccess({ deduped: res.deduped }),
  });

  const apiErr = mutation.error as { body?: { code?: string }; message?: string } | null;
  const errorCode = apiErr?.body?.code;
  const errorMessage =
    errorCode === 'CANNOT_REPORT_SELF'
      ? t('errorSelf')
      : errorCode === 'REPORTED_USER_NOT_FOUND'
        ? t('errorNotFound')
        : apiErr?.message ?? null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 9000,
      }}
      onClick={(e) => {
        // Close on backdrop click (but not on the dialog itself)
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
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
          <div className="flex items-center gap-2">
            <IconShieldCheck size={20} className="shrink-0" style={{ color: STATUS.danger }} />
            <h2
              id="report-modal-title"
              className="text-lead font-bold"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              {t('title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-opacity-80"
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
              {t('successTitle')}
            </div>
            <p className="text-body mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              {success.deduped ? t('successDeduped') : t('successNew')}
            </p>
            <Button variant="primary" fullWidth onClick={onClose}>
              {t('close')}
            </Button>
          </div>
        ) : (
          <>
            {reportedUserName && (
              <div
                className="text-caption mb-3 px-3 py-2 rounded-lg"
                style={{
                  background: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-secondary)',
                }}
              >
                {t.rich('reportingPrefix', { name: reportedUserName, b: (chunks) => <strong style={{ color: 'var(--theme-text-primary)' }}>{chunks}</strong> })}
              </div>
            )}

            <div
              className="text-caption uppercase font-bold tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {t('reasonLabel')}
            </div>
            <div className="space-y-1.5 mb-4">
              {REASONS.map((r) => {
                const sel = reason === r.value;
                const Icon = r.Icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: sel ? 'rgba(239,68,68,.1)' : 'var(--theme-bg-secondary)',
                      border: `1px solid ${sel ? 'rgba(239,68,68,.4)' : 'var(--theme-border)'}`,
                      color: sel ? STATUS.danger : 'var(--theme-text-primary)',
                    }}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="font-medium text-body">{t(r.labelKey as 'reasonHarassment')}</span>
                    {sel && <IconCheck size={14} className="ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div
              className="text-caption uppercase font-bold tracking-wider mb-2"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {t('descLabel')}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descPlaceholder')}
              maxLength={1000}
              rows={4}
              className="w-full px-3 py-2 rounded-lg mb-1 text-body resize-y"
              style={{
                background: 'var(--theme-bg-secondary)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text-primary)',
                minHeight: 80,
              }}
            />
            <div
              className="text-caption text-right mb-3"
              style={{ color: 'var(--theme-text-muted)' }}
            >
              {description.length}/1000
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

            <div
              className="text-caption mb-3 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.25)',
                color: ACCENT.xp,
              }}
            >
              {t('warning')}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" fullWidth onClick={onClose}>
                {t('cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                fullWidth
                isLoading={mutation.isPending}
                onClick={() => mutation.mutate()}
                style={{ background: STATUS.danger }}
              >
                {t('submit')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
