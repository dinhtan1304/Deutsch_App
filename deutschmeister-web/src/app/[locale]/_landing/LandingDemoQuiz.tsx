'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';
import { trackDemoStart, trackDemoComplete } from '@/lib/analytics';
import { hexToRgb, DEMO_API_URL } from './utils';

interface DemoWord {
  id: string;
  word: string;
  article: string;
  gender: string;
  translationVi: string | null;
}

const ARTICLE_COLORS: Record<string, string> = {
  der: ACCENT.srs,
  die: ACCENT.listening,
  das: STATUS.success,
};

export function LandingDemoQuiz() {
  const t = useTranslations('landing.demoQuiz');
  const [phase, setPhase] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [words, setWords] = useState<DemoWord[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${DEMO_API_URL}/words/random?count=10&levels[]=A1`);
      const data: DemoWord[] = await res.json();
      if (!data.length) return;
      setWords(data);
      setIdx(0);
      setScore(0);
      setSelected(null);
      setPhase('playing');
      trackDemoStart();
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleAnswer = (article: string) => {
    if (selected) return;
    const w0 = words[idx];
    if (!w0) return;
    const correct = w0.article.toLowerCase();
    const isCorrect = article === correct;
    if (isCorrect) setScore((s) => s + 1);
    setSelected(article);
    setTimeout(() => {
      if (idx + 1 < words.length) {
        setIdx((i) => i + 1);
        setSelected(null);
      } else {
        setPhase('finished');
        // score state hasn't flushed the last increment yet — tally it explicitly.
        trackDemoComplete(score + (isCorrect ? 1 : 0), words.length);
      }
    }, 900);
  };

  if (phase === 'idle') {
    return (
      <button
        onClick={startQuiz}
        disabled={loading}
        className="btn-glow"
        style={{
          width: '100%', padding: '20px 28px', borderRadius: 16,
          background: GRADIENT.writing,
          color: 'white', fontWeight: 700, fontSize: 16, border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          boxShadow: '0 8px 32px rgba(99,102,241,.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} />
            {t('loading')}
          </span>
        ) : (
          <>
            <span style={{ fontSize: 20 }}>🎯</span>
            {t('start')}
          </>
        )}
      </button>
    );
  }

  if (phase === 'playing') {
    const w = words[idx];
    if (!w) return null;
    const correct = w.article.toLowerCase();

    return (
      <div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 24 }}>
          {words.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: i < idx ? STATUS.success : i === idx ? 'rgba(99,102,241,.7)' : 'rgba(255,255,255,.1)',
              transition: 'background .3s',
            }} />
          ))}
        </div>

        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
          {t('questionProgress', { current: idx + 1, total: words.length })}
        </div>

        <div style={{
          textAlign: 'center', padding: '36px 24px', borderRadius: 20,
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: '-0.5px' }}>
            {selected ? (
              <><span style={{ color: ARTICLE_COLORS[correct] || 'white' }}>{w.article}</span> {w.word}</>
            ) : (
              <><span style={{ color: 'rgba(255,255,255,.6)' }}>___</span> {w.word}</>
            )}
          </div>
          {w.translationVi && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', fontStyle: 'italic' }}>
              {w.translationVi}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {(['der', 'die', 'das'] as const).map((art) => {
            const color = ARTICLE_COLORS[art]!;
            let bg = `rgba(${hexToRgb(color)}, .1)`;
            let border = `1px solid rgba(${hexToRgb(color)}, .25)`;
            let textColor = color;
            let opacity = 1;

            if (selected) {
              if (art === correct) {
                bg = `rgba(${hexToRgb(STATUS.success)}, .25)`;
                border = `2px solid ${STATUS.success}`;
                textColor = STATUS.success;
              } else if (art === selected && art !== correct) {
                bg = `rgba(${hexToRgb(STATUS.danger)}, .2)`;
                border = `2px solid ${STATUS.danger}`;
                textColor = STATUS.danger;
              } else {
                opacity = 0.3;
              }
            }

            return (
              <button
                key={art}
                onClick={() => handleAnswer(art)}
                disabled={!!selected}
                style={{
                  padding: '16px 8px', borderRadius: 14,
                  background: bg, border, color: textColor,
                  fontWeight: 800, fontSize: 18, cursor: selected ? 'default' : 'pointer',
                  opacity, transition: 'all .2s',
                  textTransform: 'capitalize',
                }}
              >
                {art}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const pct = Math.round((score / words.length) * 100);
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const msg = pct >= 80 ? t('resultExcellent') : pct >= 50 ? t('resultGood') : t('resultKeepGoing');

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 4 }}>
        {score}<span style={{ color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>/{words.length}</span>
      </div>
      <div style={{ fontSize: 16, color: 'rgba(255,255,255,.55)', marginBottom: 8 }}>{msg}</div>
      <div
        style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: 100,
          background: pct >= 80 ? `${STATUS.success}26` : pct >= 50 ? `${ACCENT.srs}26` : `${ACCENT.xp}26`,
          color: pct >= 80 ? STATUS.success : pct >= 50 ? ACCENT.srs : ACCENT.xp,
          fontSize: 13, fontWeight: 700, marginBottom: 28,
        }}>
        {t('accuracy', { pct })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link
          href="/auth/register"
          className="btn-glow"
          style={{
            display: 'block', padding: '15px 28px', borderRadius: 14,
            background: GRADIENT.writing,
            color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(99,102,241,.35)',
          }}
        >
          {t('registerCta')}
        </Link>
        <button
          onClick={() => {
            setPhase('idle');
            setWords([]);
            setIdx(0);
            setScore(0);
            setSelected(null);
          }}
          style={{
            padding: '13px 24px', borderRadius: 14,
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            color: 'rgba(255,255,255,.6)', fontWeight: 600, fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {t('playAgain')}
        </button>
      </div>
    </div>
  );
}
