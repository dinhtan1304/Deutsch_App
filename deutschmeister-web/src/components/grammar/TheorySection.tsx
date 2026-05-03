'use client';
/* eslint-disable no-restricted-syntax */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ACCENT, STATUS } from '@/lib/tokens';
import { usePronunciation } from '@/hooks/usePronunciation';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';
import { IconVolume } from '@/components/ui/Icons';

interface Section {
  title: { de: string; en: string; vi: string };
  content: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
}

interface TheorySectionProps {
  content: { sections: Section[] };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function isIPAorMeta(text: string): boolean {
  const t = text.trim();
  if (/\/[^/]+\//.test(t)) return true;
  if (/^\d+(st|nd|rd|th)$/.test(t)) return true;
  if (['Person', 'Context', 'Kontext'].includes(t)) return true;
  return false;
}

function extractGerman(text: string): string {
  const cleaned = text.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (cleaned.includes('/') && !cleaned.includes(' ')) return cleaned.split('/')[0] ?? cleaned;
  return cleaned;
}

function getAudioColumnIndex(headers: string[], rows: string[][]): number {
  const len = headers.length;
  if (len >= 3) return len - 1;
  if (len === 2 && rows.length > 0 && !isIPAorMeta(rows[0]![1]!)) return 1;
  return -1;
}

/** Detect if this table is an alphabet card table (Aa/Bb/… grid) */
function isAlphabetTable(table: { headers: string[]; rows: string[][] }): boolean {
  if (table.headers.length !== 4) return false;
  const sample = table.rows.slice(0, 5);
  return sample.every(row => {
    const cell = row[0]?.trim() ?? '';
    return cell.length >= 1 && cell.length <= 5 && /^[A-Za-zÄÖÜäöüß\s]+$/.test(cell);
  });
}

/** Check if a letter is a special German character */
function isSpecialLetter(letter: string): boolean {
  return /[ÄÖÜäöüß]/.test(letter);
}

/** Parse "Apfel (táo)" → { de: "Apfel", vi: "táo" } */
function parseExample(raw: string): { de: string; vi: string } | null {
  const m = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (!m) return null;
  return { de: m[1]!.trim(), vi: m[2]!.trim() };
}

// ─── Alphabet card data ────────────────────────────────────────────────

const LETTER_TIPS: Record<string, string> = {
  'Aa': "Tương tự 'a' tiếng Anh nhưng rõ hơn, kéo dài. Không nuốt âm cuối.",
  'Bb': "Giống 'b' tiếng Việt, nhưng môi chạm nhau chắc hơn.",
  'Cc': "Trước e/i/y phát âm 'ts', trước a/o/u phát âm 'k'.",
  'Dd': "Như 'd' tiếng Anh nhưng không bật hơi. Cuối từ đọc như 't'.",
  'Ee': "Giữ miệng hơi mở, kéo dài âm. Không trượt sang âm khác.",
  'Ff': "Giống 'ph' tiếng Việt. Môi dưới chạm răng trên.",
  'Gg': "Như 'g' trong 'go', không phải 'j'. Cuối từ đọc như 'k'.",
  'Hh': "Thở ra nhẹ, như 'h' tiếng Anh. Không rung cổ họng.",
  'Ii': "Ngắn và rõ như 'i' tiếng Việt. Không kéo dài.",
  'Jj': "Phát âm như 'y' trong 'yes'. Không phải 'j' tiếng Anh.",
  'Kk': "Như 'k' tiếng Việt nhưng bật hơi mạnh hơn.",
  'Ll': "Đặt đầu lưỡi sau răng trên. Rõ hơn 'l' tiếng Anh.",
  'Mm': "Giống 'm' tiếng Việt. Môi chạm nhau.",
  'Nn': "Giống 'n' tiếng Việt. Đầu lưỡi chạm nướu trên.",
  'Oo': "Tròn môi và giữ nguyên vị trí. Không trượt sang âm khác.",
  'Pp': "Như 'p' tiếng Việt nhưng bật hơi mạnh hơn.",
  'Qq': "Luôn đi kèm 'u', phát âm như 'kv'. Ví dụ: Quelle = kvelle.",
  'Rr': "Rung nhẹ ở cuống họng (khác với 'r' tiếng Việt đầu lưỡi).",
  'Ss': "Đầu từ trước nguyên âm đọc như 'z'. Cuối từ đọc như 's'.",
  'Tt': "Như 't' tiếng Anh, bật hơi. Cuối từ giữ nguyên.",
  'Uu': "Tròn môi chắc và ngắn. Không kéo dài như 'u' tiếng Việt.",
  'Vv': "Phát âm như 'f' (không phải 'v'). Ví dụ: Vater = Fater.",
  'Ww': "Phát âm như 'v' tiếng Anh. Ví dụ: Wasser = Vasser.",
  'Xx': "Phát âm như 'ks'. Ví dụ: Taxi = Taksi.",
  'Yy': "Như 'ü' ngắn hoặc 'i' trong từ mượn tiếng Anh/Hy Lạp.",
  'Zz': "Phát âm như 'ts'. Ví dụ: Zeit = Tsait.",
  'Ää': "Mở miệng rộng hơn 'a', phát âm gần như 'e' trong 'bed'.",
  'Öö': "Tròn môi như 'o' nhưng cố phát âm 'e'. Lưỡi phía trước.",
  'Üü': "Tròn môi như 'u' nhưng cố phát âm 'i'. Luyện nhiều để quen.",
  'ß':  "Chỉ có tiếng Đức, phát âm như 'ss'. Sau nguyên âm dài hoặc đôi.",
};

const CARD_PALETTE = [
  { accent: ACCENT.srs, border: 'rgba(59,130,246,.25)', bg: 'rgba(59,130,246,.05)', hoverBorder: 'rgba(59,130,246,.6)' },
  { accent: ACCENT.vocab, border: 'rgba(139,92,246,.25)', bg: 'rgba(139,92,246,.05)', hoverBorder: 'rgba(139,92,246,.6)' },
  { accent: '#10B981', border: 'rgba(16,185,129,.25)', bg: 'rgba(16,185,129,.05)', hoverBorder: 'rgba(16,185,129,.6)' },
  { accent: ACCENT.xp, border: 'rgba(245,158,11,.25)', bg: 'rgba(245,158,11,.05)', hoverBorder: 'rgba(245,158,11,.6)' },
  { accent: ACCENT.listening, border: 'rgba(236,72,153,.25)', bg: 'rgba(236,72,153,.05)', hoverBorder: 'rgba(236,72,153,.6)' },
  { accent: ACCENT.cyan, border: 'rgba(6,182,212,.25)',  bg: 'rgba(6,182,212,.05)',  hoverBorder: 'rgba(6,182,212,.6)'  },
];
const SPECIAL_PALETTE = { accent: ACCENT.xp, border: 'rgba(245,158,11,.35)', bg: 'rgba(245,158,11,.06)', hoverBorder: 'rgba(245,158,11,.7)' };

// ─── AlphabetCardGrid ──────────────────────────────────────────────────

function SpeakerIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function MicIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
    </svg>
  );
}

type NoiState = 'idle' | 'listening' | 'correct' | 'wrong';

function AlphabetCardGrid({ rows, onSpeak }: {
  rows: string[][];
  onSpeak: (text: string) => void;
}) {
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [noiState, setNoiState] = useState<Record<number, NoiState>>({});
  const [flippedIdx, setFlippedIdx] = useState<number | null>(null);

  const handleNghe = (idx: number, letterName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeakingIdx(idx);
    onSpeak(letterName);
    setTimeout(() => setSpeakingIdx(null), 1600);
  };

  const handleNoi = (idx: number, expected: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setNoiState(prev => ({ ...prev, [idx]: 'wrong' }));
      setTimeout(() => setNoiState(prev => ({ ...prev, [idx]: 'idle' })), 1500);
      return;
    }
    setNoiState(prev => ({ ...prev, [idx]: 'listening' }));
    const recog = new SR();
    recog.lang = 'de-DE';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recog.onresult = (ev: any) => {
      const spoken = ev.results[0][0].transcript.toLowerCase().trim();
      const exp = expected.toLowerCase().trim();
      const match = spoken.includes(exp) || exp.includes(spoken) || levenshtein(spoken, exp) <= 2;
      setNoiState(prev => ({ ...prev, [idx]: match ? 'correct' : 'wrong' }));
      setTimeout(() => setNoiState(prev => ({ ...prev, [idx]: 'idle' })), 2200);
    };
    recog.onerror = () => setNoiState(prev => ({ ...prev, [idx]: 'idle' }));
    recog.start();
  };

  const togglePin = (idx: number) => {
    setFlippedIdx(prev => prev === idx ? null : idx);
  };

  return (
    <>
      <style>{`
        .alpha-card-inner {
          transition: transform 0.45s cubic-bezier(.4,0,.2,1);
          transform-style: preserve-3d;
          position: relative;
        }
        .alpha-card-inner.flipped { transform: rotateY(180deg); }
        .alpha-card-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .alpha-card-back { transform: rotateY(180deg); }
      `}</style>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-4">
        {rows.map((row, idx) => {
          const letter  = row[0]?.trim() ?? '';
          const name    = row[1]?.trim() ?? '';
          const ipa     = row[2]?.trim() ?? '';
          const exRaw   = row[3]?.trim() ?? '';
          const ex      = parseExample(exRaw);
          const special = isSpecialLetter(letter);
          const ns      = noiState[idx] ?? 'idle';
          const isNghe  = speakingIdx === idx;
          const palette = special ? SPECIAL_PALETTE : CARD_PALETTE[idx % CARD_PALETTE.length]!;
          const tip     = LETTER_TIPS[letter] ?? `Luyện phát âm "${name}" nhiều lần để quen.`;
          const isFlipped = flippedIdx === idx;

          return (
            <div
              key={idx}
              className="rounded-xl overflow-hidden"
              style={{
                height: 210,
                perspective: '900px',
                cursor: 'pointer',
              }}
              onClick={() => togglePin(idx)}
            >
              <div className={`alpha-card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

                {/* ── FRONT: letter card ── */}
                <div
                  className="alpha-card-face absolute inset-0 rounded-xl flex flex-col overflow-hidden"
                  style={{
                    border: `1.5px solid ${isFlipped ? palette.hoverBorder : palette.border}`,
                    background: palette.bg,
                    transition: 'border-color .25s',
                  }}
                >
                  {special && (
                    <div className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-center"
                      style={{ background: 'rgba(245,158,11,.18)', color: ACCENT.xp }}>
                      Đặc biệt
                    </div>
                  )}
                  <div className="flex-1 flex flex-col items-center justify-center px-3 pt-4 pb-2 text-center gap-1">
                    <div className="font-black leading-none mb-1" style={{ fontSize: '2.5rem', color: 'var(--theme-text-primary)' }}>
                      {letter}
                    </div>
                    <div className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>{name}</div>
                    {ipa && (
                      <div className="text-xs font-mono font-semibold" style={{ color: palette.accent }}>{ipa}</div>
                    )}
                    {ex ? (
                      <div className="text-caption mt-0.5 leading-tight" style={{ color: 'var(--theme-text-muted)' }}>
                        <span className="font-bold underline decoration-dotted" style={{ color: 'var(--theme-text-secondary)' }}>{ex.de}</span>
                        {' '}<span>({ex.vi})</span>
                      </div>
                    ) : exRaw ? (
                      <div className="text-caption mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{exRaw}</div>
                    ) : null}
                  </div>
                  <div className="flex border-t" style={{ borderColor: palette.border }}>
                    <button
                      onClick={(e) => handleNghe(idx, name, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-r"
                      style={{ borderColor: palette.border, background: isNghe ? `${palette.accent}18` : 'transparent', color: isNghe ? palette.accent : 'var(--theme-text-muted)' }}
                    >
                      <SpeakerIcon /> Nghe
                    </button>
                    <button
                      onClick={(e) => handleNoi(idx, name, e)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all"
                      style={{
                        background: ns === 'listening' ? 'rgba(34,197,94,.1)' : ns === 'correct' ? 'rgba(34,197,94,.15)' : ns === 'wrong' ? 'rgba(239,68,68,.1)' : 'transparent',
                        color: ns === 'idle' ? 'var(--theme-text-muted)' : ns === 'listening' ? STATUS.success : ns === 'correct' ? STATUS.success : STATUS.danger,
                      }}
                    >
                      {ns === 'idle'      && <><MicIcon /> Nói</>}
                      {ns === 'listening' && <><span className="animate-pulse">●</span> Đang nghe</>}
                      {ns === 'correct'   && <>✓ Tốt lắm!</>}
                      {ns === 'wrong'     && <>✗ Thử lại</>}
                    </button>
                  </div>
                </div>

                {/* ── BACK: mẹo nhớ ── */}
                <div
                  className="alpha-card-face alpha-card-back absolute inset-0 rounded-xl flex flex-col items-center justify-center p-4 text-center gap-3"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', border: `1.5px solid rgba(139,92,246,.5)` }}
                >
                  <div style={{ color: 'rgba(255,255,255,.8)' }}><SparkleIcon /></div>
                  <div>
                    <div className="text-body font-extrabold text-white mb-1">Mẹo nhớ</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,.82)' }}>{tip}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin(idx); }}
                    className="mt-1 px-3 py-1 rounded-lg text-caption font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,.18)', color: 'rgba(255,255,255,.9)' }}
                  >
                    Click để lật lại
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Simple Levenshtein for fuzzy pronunciation matching
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i]![j] = a[i-1] === b[j-1] ? dp[i-1]![j-1]! : 1 + Math.min(dp[i-1]![j]!, dp[i]![j-1]!, dp[i-1]![j-1]!);
  return dp[m]![n]!;
}

// ─── Main TheorySection ────────────────────────────────────────────────

export const TheorySection = ({ content }: TheorySectionProps) => {
  const { speak } = usePronunciation();
  const [playingCell, setPlayingCell] = useState<string | null>(null);
  const [readingAll, setReadingAll] = useState<number | null>(null); // section idx being read
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (speakTimerRef.current) clearTimeout(speakTimerRef.current); }, []);

  const handleSpeak = useCallback((text: string, cellKey: string) => {
    const german = extractGerman(text);
    if (!german) return;
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setPlayingCell(cellKey);
    speak(german);
    speakTimerRef.current = setTimeout(() => setPlayingCell(null), 1800);
  }, [speak]);

  const handleReadAll = useCallback((sectionIdx: number, section: Section) => {
    setReadingAll(sectionIdx);
    const texts: string[] = [];
    if (section.content) texts.push(extractGerman(section.content));
    if (section.table) {
      section.table.rows.forEach(row => {
        const last = row[row.length - 1];
        if (last && !isIPAorMeta(last)) texts.push(extractGerman(last));
      });
    }
    let i = 0;
    const next = () => {
      if (i >= texts.length) { setReadingAll(null); return; }
      speak(texts[i++]!);
      speakTimerRef.current = setTimeout(next, 2000);
    };
    next();
  }, [speak]);

  return (
    <div className="space-y-5">
      {content.sections.map((section, sIdx) => {
        const hasAlphabetTable = section.table ? isAlphabetTable(section.table) : false;
        const audioCol = section.table && !hasAlphabetTable
          ? getAudioColumnIndex(section.table.headers, section.table.rows)
          : -1;

        return (
          <div
            key={sIdx}
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}
          >
            {/* ── Section header ── */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between gap-3"
              style={{
                borderColor: 'var(--theme-border)',
                background: 'linear-gradient(135deg, rgba(139,92,246,.06), rgba(99,102,241,.03))',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}
                >
                  {sIdx + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>
                    {section.title.vi}
                  </h3>
                  <p className="text-xs truncate" style={{ color: 'var(--theme-text-muted)' }}>
                    {section.title.de}
                  </p>
                </div>
              </div>

              {/* "Đọc toàn bộ" button */}
              <button
                onClick={() => readingAll === sIdx ? setReadingAll(null) : handleReadAll(sIdx, section)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03]"
                style={readingAll === sIdx ? {
                  background: 'rgba(139,92,246,.15)',
                  color: ACCENT.vocab,
                } : {
                  background: 'var(--theme-bg-secondary)',
                  color: 'var(--theme-text-muted)',
                  border: '1px solid var(--theme-border)',
                }}
              >
                <IconVolume size={13} className={readingAll === sIdx ? 'animate-pulse' : ''} />
                {readingAll === sIdx ? 'Đang đọc...' : 'Đọc toàn bộ'}
              </button>
            </div>

            {/* ── Description ── */}
            {section.content && (
              <div className="px-6 py-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                  <HighlightedText text={section.content} />
                </p>
              </div>
            )}

            {/* ── Alphabet card grid ── */}
            {section.table && hasAlphabetTable && (
              <AlphabetCardGrid rows={section.table.rows} onSpeak={speak} />
            )}

            {/* ── Regular table ── */}
            {section.table && !hasAlphabetTable && (
              <div className="px-4 pb-4">
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--theme-border)' }}>
                  {/* Header */}
                  <div
                    className="grid text-[10.5px] font-bold uppercase tracking-widest px-3 py-2.5"
                    style={{
                      backgroundColor: 'var(--theme-bg-secondary)',
                      color: 'var(--theme-text-muted)',
                      gridTemplateColumns: `repeat(${section.table.headers.length}, 1fr)${audioCol >= 0 ? ' 40px' : ''}`,
                    }}
                  >
                    {section.table.headers.map((h, hIdx) => (
                      <span key={hIdx} className={hIdx === 0 ? 'pl-4' : 'pl-2'}>{h}</span>
                    ))}
                    {audioCol >= 0 && <span />}
                  </div>

                  {/* Rows */}
                  {section.table.rows.map((row, rIdx) => {
                    const cellKey  = `${sIdx}-${rIdx}`;
                    const isPlaying = playingCell === cellKey;
                    const audioText = audioCol >= 0 ? (row[audioCol] ?? '') : '';
                    const palette  = CARD_PALETTE[rIdx % CARD_PALETTE.length]!;

                    return (
                      <div
                        key={rIdx}
                        className="grid items-center border-t transition-colors duration-150"
                        style={{
                          gridTemplateColumns: `repeat(${row.length}, 1fr)${audioCol >= 0 ? ' 40px' : ''}`,
                          borderColor: 'var(--theme-border)',
                          borderLeft: `3px solid ${palette.accent}`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = palette.bg; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                      >
                        {row.map((cell, cIdx) => {
                          const isIPA  = isIPAorMeta(cell);
                          const isFirst = cIdx === 0;
                          return (
                            <div key={cIdx} className="px-3 py-3.5">
                              {isIPA ? (
                                <span
                                  className="inline-block px-2 py-0.5 rounded-md text-caption font-mono font-semibold"
                                  style={{ backgroundColor: `${palette.accent}18`, color: palette.accent }}
                                >
                                  {cell}
                                </span>
                              ) : isFirst ? (
                                <span className="text-body font-bold pl-1" style={{ color: 'var(--theme-text-primary)' }}>
                                  <HighlightedText text={cell} />
                                </span>
                              ) : (
                                <span className="text-body" style={{ color: 'var(--theme-text-secondary)' }}>
                                  <HighlightedText text={cell} />
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Audio button */}
                        {audioCol >= 0 && (
                          <div className="flex items-center justify-center pr-2">
                            <button
                              onClick={() => handleSpeak(audioText, cellKey)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                              style={{
                                backgroundColor: isPlaying ? `${palette.accent}20` : 'transparent',
                                color: isPlaying ? palette.accent : 'var(--theme-text-muted)',
                              }}
                              title={`Nghe: ${extractGerman(audioText)}`}
                            >
                              <IconVolume
                                size={15}
                                className={isPlaying ? 'animate-pulse' : ''}
                                style={{ opacity: isPlaying ? 1 : 0.5 }}
                              />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
