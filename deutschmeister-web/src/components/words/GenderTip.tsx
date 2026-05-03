'use client';

import { Gender } from '@/types';
import { ACCENT, STATUS } from '@/lib/tokens';
import { getBestRule, getTipForWord } from '@/lib/genderRules';

interface GenderTipProps {
  word: string;
  gender: Gender;
  showDetailed?: boolean;
}

// ─── Lightbulb SVG icon ───
function IconLightbulb({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}

const COLORS = {
  masculine: { bg: `${ACCENT.srs}1a`, border: ACCENT.srs, text: ACCENT.srs, light: `${ACCENT.srs}0d` },
  feminine: { bg: `${ACCENT.listening}1a`, border: ACCENT.listening, text: ACCENT.listening, light: `${ACCENT.listening}0d` },
  neuter: { bg: `${STATUS.success}1a`, border: STATUS.success, text: STATUS.success, light: `${STATUS.success}0d` },
};

export function GenderTip({ word, gender, showDetailed = false }: GenderTipProps) {
  const rule = getBestRule(word, gender);
  if (!rule) return null;

  const c = COLORS[gender];
  const article = gender === 'masculine' ? 'der' : gender === 'feminine' ? 'die' : 'das';

  let patternDisplay = '';
  if (rule.type === 'ending') {
    patternDisplay = rule.pattern.replace('$', '').replace('-', '-');
  } else if (rule.type === 'prefix') {
    patternDisplay = rule.pattern.replace('^', '') + '-';
  }

  // ─── Inline tip ───
  if (!showDetailed) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-body"
        style={{ backgroundColor: c.bg }}>
        <IconLightbulb size={14} />
        <span style={{ color: c.text }}>
          {rule.type === 'ending' && <>Đuôi <strong>{patternDisplay}</strong> → {article} ({rule.reliability}%)</>}
          {rule.type === 'prefix' && <>Tiền tố <strong>{patternDisplay}</strong> → {article} ({rule.reliability}%)</>}
          {(rule.type === 'category' || rule.type === 'special') && <>{rule.description}</>}
        </span>
      </div>
    );
  }

  // ─── Detailed card ───
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: c.light, borderLeft: `3px solid ${c.border}` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: c.bg, color: c.text }}>
          <IconLightbulb size={16} />
        </span>
        <span className="font-semibold text-sm" style={{ color: c.text }}>Mẹo nhớ</span>
        <span className="ml-auto px-2.5 py-0.5 rounded-full text-caption font-semibold text-white"
          style={{ backgroundColor: c.border }}>
          {rule.reliability}% chính xác
        </span>
      </div>

      <p className="text-body mb-3" style={{ color: c.text }}>{rule.description}</p>

      {/* Examples */}
      <div className="flex flex-wrap gap-1.5">
        {rule.examples.slice(0, 4).map((ex, i) => (
          <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ backgroundColor: c.bg, color: c.text }}>
            {ex}
          </span>
        ))}
      </div>

      {/* Exceptions */}
      {rule.exceptions && rule.exceptions.length > 0 && (
        <p className="text-caption mt-2.5" style={{ color: 'var(--theme-text-muted)' }}>
          ⚠️ Ngoại lệ: {rule.exceptions.slice(0, 3).join(', ')}
        </p>
      )}
    </div>
  );
}

/**
 * Simple function to get tip text (for games)
 */
export function getSimpleTip(word: string, gender: Gender): string | null {
  return getTipForWord(word, gender);
}