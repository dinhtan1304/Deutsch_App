'use client';

/**
 * ArticleChip — German article color-code (v2 redesign).
 * A 6px colored dot + the article word ("der"/"die"/"das").
 * Colors come from CSS vars --der/--die/--das (globals.css).
 *   der → blue · die → pink · das → green
 */
export type Article = 'der' | 'die' | 'das';

const ARTICLE_VAR: Record<Article, string> = {
  der: 'var(--der)',
  die: 'var(--die)',
  das: 'var(--das)',
};

interface ArticleChipProps {
  article: Article;
  size?: 'sm' | 'md';
  className?: string;
  /** Tinted pill background around the dot + article (v2 word card header). */
  filled?: boolean;
}

export function ArticleChip({ article, size = 'md', className = '', filled = false }: ArticleChipProps) {
  const color = ARTICLE_VAR[article];
  const fontSize = size === 'sm' ? 11 : 12.5;
  const dot = size === 'sm' ? 5 : 6;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold select-none ${filled ? 'rounded-md' : ''} ${className}`}
      style={{
        color,
        fontSize,
        ...(filled
          ? { background: `color-mix(in srgb, ${color} 14%, transparent)`, padding: '3px 9px 3px 7px' }
          : {}),
      }}
    >
      <span
        className="rounded-full shrink-0"
        style={{ width: dot, height: dot, background: color }}
        aria-hidden
      />
      {article}
    </span>
  );
}
