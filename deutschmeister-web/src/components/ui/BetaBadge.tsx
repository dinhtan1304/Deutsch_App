import { useTranslations } from 'next-intl';
import { ACCENT } from '@/lib/tokens';

interface BetaBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Small "BETA" pill used in nav (sm) and page hero (md).
 * Amber-on-translucent-amber — consistent with the xp accent.
 */
export function BetaBadge({ size = 'sm', className }: BetaBadgeProps) {
  const t = useTranslations('common.ui');
  const isSm = size === 'sm';
  return (
    <span
      role="img"
      aria-label={t('betaFeature')}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        letterSpacing: '0.04em',
        fontSize: isSm ? 9.5 : 11,
        lineHeight: 1,
        padding: isSm ? '2px 5px' : '4px 7px',
        borderRadius: 999,
        background: 'rgba(245, 158, 11, 0.16)',
        color: ACCENT.xp,
        border: '1px solid rgba(245, 158, 11, 0.4)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      BETA
    </span>
  );
}
