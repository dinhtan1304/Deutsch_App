'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePronunciation } from '@/hooks/usePronunciation';
import { HighlightedText } from '@/components/word-highlight/HighlightedText';

interface TheorySectionProps {
    content: {
        sections: {
            title: { de: string; en: string; vi: string };
            content: string;
            table?: {
                headers: string[];
                rows: string[][];
            };
        }[];
    };
}

/* ─── Inline Icons ─── */
function IconVolume2({ size = 16, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"
            className={className} style={{ display: 'block', ...style }}>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
    );
}

/**
 * Check if a cell is an IPA / meta label (not pronounceable by TTS).
 */
function isIPAorMeta(text: string): boolean {
    const t = text.trim();
    if (/\/[^/]+\//.test(t)) return true; // IPA: /aː/, /ʃ/
    if (/^\d+(st|nd|rd|th)$/.test(t)) return true; // 1st, 2nd
    if (['Person', 'Context', 'Kontext'].includes(t)) return true;
    return false;
}

/**
 * Extract German portion: "ich (I)" → "ich", "er/sie/es (he/she/it)" → "er"
 */
function extractGerman(text: string): string {
    const cleaned = text.replace(/\s*\([^)]*\)\s*/g, '').trim();
    // If it has slashes like "er/sie/es", take the first
    if (cleaned.includes('/') && !cleaned.includes(' ')) {
        return cleaned.split('/')[0];
    }
    return cleaned;
}

/**
 * Decide which column gets the 🔊 button.
 * → Last column for 3+ col tables (always "Example")
 * → Col 1 for 2-col tables if German text
 * → -1 = no audio
 */
function getAudioColumnIndex(headers: string[], rows: string[][]): number {
    const len = headers.length;
    if (len >= 3) return len - 1;
    if (len === 2 && rows.length > 0 && !isIPAorMeta(rows[0][1])) return 1;
    return -1;
}

export const TheorySection = ({ content }: TheorySectionProps) => {
    const { speak } = usePronunciation();
    const [playingCell, setPlayingCell] = useState<string | null>(null);
    const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear timer khi unmount tránh setState trên component đã unmount
    useEffect(() => () => { if (speakTimerRef.current) clearTimeout(speakTimerRef.current); }, []);

    const handleSpeak = useCallback((text: string, cellKey: string) => {
        const german = extractGerman(text);
        if (!german) return;
        if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
        setPlayingCell(cellKey);
        speak(german);
        speakTimerRef.current = setTimeout(() => setPlayingCell(null), 1800);
    }, [speak]);

    return (
        <div className="space-y-6">
            {content.sections.map((section, sIdx) => {
                const audioCol = section.table
                    ? getAudioColumnIndex(section.table.headers, section.table.rows)
                    : -1;

                return (
                    <div key={sIdx}
                        className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: 'var(--theme-bg-card)', borderColor: 'var(--theme-border)' }}>

                        {/* ── Section Header ── */}
                        <div className="px-6 py-4 border-b"
                            style={{
                                borderColor: 'var(--theme-border)',
                                background: 'linear-gradient(135deg, rgba(139,92,246,.06), rgba(99,102,241,.03))',
                            }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] font-bold text-white shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                                    {sIdx + 1}
                                </div>
                                <div>
                                    <h3 className="text-[16px] font-bold" style={{ color: 'var(--theme-text-primary)' }}>
                                        {section.title.vi}
                                    </h3>
                                    <p className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
                                        {section.title.de}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Description ── */}
                        <div className="px-6 py-4">
                            <p className="text-[14px] leading-relaxed" style={{ color: 'var(--theme-text-secondary)' }}>
                                <HighlightedText text={section.content} />
                            </p>
                        </div>

                        {/* ── Table ── */}
                        {section.table && (
                            <div className="px-4 pb-4">
                                <div className="rounded-xl border overflow-x-auto"
                                    style={{ borderColor: 'var(--theme-border)' }}>
                                    <table className="w-full text-[13px]">
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--theme-bg-secondary)' }}>
                                                {section.table.headers.map((header, hIdx) => (
                                                    <th key={hIdx}
                                                        className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider"
                                                        style={{ color: 'var(--theme-text-muted)' }}>
                                                        {header}
                                                    </th>
                                                ))}
                                                {audioCol >= 0 && (
                                                    <th className="px-3 py-2.5 w-12" />
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.table.rows.map((row, rIdx) => {
                                                const cellKey = `${sIdx}-${rIdx}`;
                                                const isPlaying = playingCell === cellKey;
                                                const audioText = audioCol >= 0 ? row[audioCol] : '';

                                                return (
                                                    <tr key={rIdx}
                                                        className="border-t transition-colors"
                                                        style={{ borderColor: 'var(--theme-border)' }}>
                                                        {row.map((cell, cIdx) => (
                                                            <td key={cIdx}
                                                                className="px-4 py-3"
                                                                style={{
                                                                    color: cIdx === 0
                                                                        ? 'var(--theme-text-primary)'
                                                                        : 'var(--theme-text-secondary)',
                                                                    fontWeight: cIdx === 0 ? 600 : 400,
                                                                    fontFamily: isIPAorMeta(cell) ? 'monospace' : 'inherit',
                                                                    fontSize: isIPAorMeta(cell) ? '12px' : undefined,
                                                                }}>
                                                                {isIPAorMeta(cell) ? cell : <HighlightedText text={cell} />}
                                                            </td>
                                                        ))}
                                                        {audioCol >= 0 && (
                                                            <td className="px-2 py-3 text-center">
                                                                <button
                                                                    onClick={() => handleSpeak(audioText, cellKey)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all duration-200 hover:scale-110"
                                                                    style={{
                                                                        backgroundColor: isPlaying
                                                                            ? 'rgba(139,92,246,.15)'
                                                                            : 'transparent',
                                                                        color: isPlaying
                                                                            ? '#8B5CF6'
                                                                            : 'var(--theme-text-muted)',
                                                                    }}
                                                                    title={`Nghe: ${extractGerman(audioText)}`}>
                                                                    <IconVolume2
                                                                        size={15}
                                                                        className={isPlaying ? 'animate-pulse' : ''}
                                                                        style={{ opacity: isPlaying ? 1 : 0.35 }}
                                                                    />
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};