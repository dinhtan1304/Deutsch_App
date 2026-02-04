'use client';

import { Gender } from '@/types';
import { getBestRule, getTipForWord, GenderRule } from '@/lib/genderRules';

interface GenderTipProps {
  word: string;
  gender: Gender;
  showDetailed?: boolean;
}

export function GenderTip({ word, gender, showDetailed = false }: GenderTipProps) {
  const rule = getBestRule(word, gender);
  
  if (!rule) return null;

  const colors = {
    masculine: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#2563eb' },
    feminine: { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' },
    neuter: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#16a34a' },
  };
  const c = colors[gender];

  const article = gender === 'masculine' ? 'der' : gender === 'feminine' ? 'die' : 'das';

  // Get the pattern display
  let patternDisplay = '';
  if (rule.type === 'ending') {
    patternDisplay = rule.pattern.replace('$', '').replace('-', '-');
  } else if (rule.type === 'prefix') {
    patternDisplay = rule.pattern.replace('^', '') + '-';
  }

  if (!showDetailed) {
    // Simple inline tip
    return (
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
        style={{ backgroundColor: c.bg }}
      >
        <span>💡</span>
        <span style={{ color: c.text }}>
          {rule.type === 'ending' && (
            <>Đuôi <strong>{patternDisplay}</strong> → {article} ({rule.reliability}%)</>
          )}
          {rule.type === 'prefix' && (
            <>Tiền tố <strong>{patternDisplay}</strong> → {article} ({rule.reliability}%)</>
          )}
          {(rule.type === 'category' || rule.type === 'special') && (
            <>{rule.description}</>
          )}
        </span>
      </div>
    );
  }

  // Detailed card
  return (
    <div 
      className="p-3 rounded-xl"
      style={{ backgroundColor: c.bg, borderLeft: `3px solid ${c.border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">💡</span>
        <span className="font-medium" style={{ color: c.text }}>
          Mẹo nhớ
        </span>
        <span 
          className="ml-auto px-2 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: c.border }}
        >
          {rule.reliability}% chính xác
        </span>
      </div>
      
      <p className="text-sm mb-2" style={{ color: c.text }}>
        {rule.description}
      </p>
      
      {/* Examples */}
      <div className="flex flex-wrap gap-1">
        {rule.examples.slice(0, 4).map((ex, i) => (
          <span 
            key={i}
            className="px-2 py-0.5 rounded text-xs"
            style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: c.text }}
          >
            {ex}
          </span>
        ))}
      </div>

      {/* Exceptions warning */}
      {rule.exceptions && rule.exceptions.length > 0 && (
        <p className="text-xs mt-2 text-gray-500">
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