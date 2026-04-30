'use client';
/* eslint-disable no-restricted-syntax -- custom UI gradients */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCompleteOnboarding } from '@/hooks/useOnboarding';
import { ACCENT, GRADIENT, STATUS } from '@/lib/tokens';

// ─── 15 Grammar Questions (5 A1 + 5 A2 + 5 B1) ──────────────────────────────
interface Question {
  level: 'A1' | 'A2' | 'B1';
  sentence: string;       // with ___ for blank
  options: string[];
  answer: number;          // index in options
  hint: string;            // grammar topic
}

const QUESTIONS: Question[] = [
  // ── A1 (1-5): Grundstufe ──
  {
    level: 'A1',
    sentence: 'Das ___ mein Bruder.',
    options: ['ist', 'bist', 'sind', 'bin'],
    answer: 0,
    hint: 'Verb "sein"',
  },
  {
    level: 'A1',
    sentence: '___ hei\u00dft du?',
    options: ['Was', 'Wer', 'Wie', 'Wo'],
    answer: 2,
    hint: 'W-Fragen',
  },
  {
    level: 'A1',
    sentence: 'Ich ___ zwei Kinder.',
    options: ['hat', 'habe', 'haben', 'hast'],
    answer: 1,
    hint: 'Verb "haben"',
  },
  {
    level: 'A1',
    sentence: 'Wir ___ gern Fu\u00dfball.',
    options: ['spielt', 'spiele', 'spielen', 'spielst'],
    answer: 2,
    hint: 'Konjugation Pr\u00e4sens',
  },
  {
    level: 'A1',
    sentence: '___ Apfel ist rot.',
    options: ['Die', 'Das', 'Der', 'Ein'],
    answer: 2,
    hint: 'Bestimmter Artikel',
  },

  // ── A2 (6-10): Grundstufe 2 ──
  {
    level: 'A2',
    sentence: 'Ich habe gestern einen Film ___.',
    options: ['sehen', 'gesehen', 'geseht', 'sah'],
    answer: 1,
    hint: 'Perfekt',
  },
  {
    level: 'A2',
    sentence: 'Er f\u00e4hrt morgen ___ seiner Mutter.',
    options: ['mit', 'auf', 'in', 'an'],
    answer: 0,
    hint: 'Dativ-Pr\u00e4positionen',
  },
  {
    level: 'A2',
    sentence: 'Ich ___ morgen fr\u00fch aufstehen.',
    options: ['kann', 'muss', 'darf', 'soll'],
    answer: 1,
    hint: 'Modalverben',
  },
  {
    level: 'A2',
    sentence: '___ du schon einmal in Berlin gewesen?',
    options: ['Hast', 'Bist', 'Wirst', 'Kannst'],
    answer: 1,
    hint: 'Perfekt mit "sein"',
  },
  {
    level: 'A2',
    sentence: 'Das Buch geh\u00f6rt ___ Lehrer.',
    options: ['der', 'den', 'dem', 'des'],
    answer: 2,
    hint: 'Dativ',
  },

  // ── B1 (11-15): Mittelstufe ──
  {
    level: 'B1',
    sentence: 'Wenn ich reich ___, w\u00fcrde ich um die Welt reisen.',
    options: ['bin', 'war', 'w\u00e4re', 'sei'],
    answer: 2,
    hint: 'Konjunktiv II',
  },
  {
    level: 'B1',
    sentence: 'Das ist der Mann, ___ ich gestern getroffen habe.',
    options: ['der', 'dem', 'den', 'dessen'],
    answer: 2,
    hint: 'Relativpronomen (Akk.)',
  },
  {
    level: 'B1',
    sentence: 'Das Haus ___ letztes Jahr gebaut.',
    options: ['hat', 'ist', 'wird', 'wurde'],
    answer: 3,
    hint: 'Passiv Pr\u00e4teritum',
  },
  {
    level: 'B1',
    sentence: 'Er kam nicht zur Arbeit, ___ er krank war.',
    options: ['dass', 'weil', 'ob', 'wenn'],
    answer: 1,
    hint: 'Kausale Nebens\u00e4tze',
  },
  {
    level: 'B1',
    sentence: 'Je mehr ich lerne, ___ besser verstehe ich.',
    options: ['so', 'desto', 'als', 'wie'],
    answer: 1,
    hint: 'je ... desto',
  },
];

// ─── Daily goal options ───────────────────────────────────────────────────────
const GOALS = [
  { value: 10, label: '10 t\u1eeb', sub: '~5 ph\u00fat' },
  { value: 20, label: '20 t\u1eeb', sub: '~10 ph\u00fat' },
  { value: 30, label: '30 t\u1eeb', sub: '~15 ph\u00fat' },
] as const;

// ─── Level color config ──────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<string, { color: string; label: string }> = {
  A1: { color: STATUS.success, label: 'S\u01a1 c\u1ea5p' },
  A2: { color: ACCENT.srs, label: 'S\u01a1 c\u1ea5p cao' },
  B1: { color: ACCENT.vocab, label: 'Trung c\u1ea5p' },
};

function determineLevel(a1: number, a2: number, b1: number): string {
  if (a1 >= 3 && a2 >= 3 && b1 >= 3) return 'B1';
  if (a1 >= 3 && a2 >= 3) return 'A2';
  return 'A1';
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const completeMutation = useCompleteOnboarding();

  // Steps: 0=Welcome, 1=Quiz, 2=Result, 3=DailyGoal, 4=Summary
  const [step, setStep] = useState(0);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  // Quiz state
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transition
  const [visible, setVisible] = useState(true);

  // Computed scores
  const scores = useMemo(() => {
    const a1 = answers.slice(0, 5).filter(Boolean).length;
    const a2 = answers.slice(5, 10).filter(Boolean).length;
    const b1 = answers.slice(10, 15).filter(Boolean).length;
    return { a1, a2, b1, total: a1 + a2 + b1 };
  }, [answers]);

  const detectedLevel = useMemo(
    () => determineLevel(scores.a1, scores.a2, scores.b1),
    [scores],
  );

  // ─── Guards ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user?.onboardingCompleted !== false) { router.replace('/dashboard'); }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => () => { if (answerTimer.current) clearTimeout(answerTimer.current); }, []);

  // ─── Navigation ─────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => { setStep((s) => s + 1); setVisible(true); }, 300);
  }, []);

  // ─── Quiz answer handler ───────────────────────────────────────────────
  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const correct = optIdx === QUESTIONS[qIdx].answer;
    setAnswers((prev) => [...prev, correct]);

    answerTimer.current = setTimeout(() => {
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx((i) => i + 1);
        setSelected(null);
      } else {
        // Quiz done → go to result step
        setVisible(false);
        setTimeout(() => { setStep(2); setVisible(true); }, 300);
      }
    }, 900);
  }, [selected, qIdx]);

  // ─── Skip onboarding (use partial results if any) ────────────────────
  const handleSkip = useCallback(async () => {
    const level = answers.length >= 5 ? determineLevel(scores.a1, scores.a2, scores.b1) : 'A1';
    try {
      await completeMutation.mutateAsync({ preferredLevel: level, dailyGoal: dailyGoal ?? 20 });
      useAuthStore.setState((s) => ({
        user: s.user ? { ...s.user, onboardingCompleted: true } : s.user,
      }));
      router.push('/dashboard');
    } catch { /* retry */ }
  }, [completeMutation, answers, scores, dailyGoal, router]);

  // ─── Final submit ──────────────────────────────────────────────────────
  const handleComplete = useCallback(async () => {
    try {
      await completeMutation.mutateAsync({
        preferredLevel: detectedLevel,
        dailyGoal: dailyGoal ?? undefined,
      });
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, onboardingCompleted: true } : state.user,
      }));
      router.push('/dashboard');
    } catch { /* retry */ }
  }, [completeMutation, detectedLevel, dailyGoal, router]);

  // ─── Guard render ──────────────────────────────────────────────────────
  if (!_hasHydrated || !isAuthenticated || user?.onboardingCompleted !== false) {
    return <div style={{ minHeight: '100vh', background: '#0a0f1e' }} />;
  }

  const cardBg = 'rgba(255,255,255,0.05)';
  const borderColor = 'rgba(255,255,255,0.1)';
  const gradientBtn: React.CSSProperties = {
    padding: '14px 32px', borderRadius: '14px',
    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
    color: 'white', fontWeight: 700, fontSize: '15px', border: 'none',
    cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
    transition: 'transform 0.2s, box-shadow 0.2s', width: '100%',
  };
  const disabledBtn: React.CSSProperties = { ...gradientBtn, opacity: 0.5, cursor: 'not-allowed' };

  const TOTAL_STEPS = 5;
  const q = QUESTIONS[qIdx];
  const levelColors: Record<string, string> = { A1: STATUS.success, A2: ACCENT.srs, B1: ACCENT.vocab };

  // ─── Step renderer ─────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // ── Welcome ──
      case 0:
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '36px', fontWeight: 800,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: '12px', lineHeight: 1.2,
            }}>
              {'Ch\u00e0o m\u1eebng b\u1ea1n!'}
            </div>
            {user?.name && (
              <div style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                {user.name}
              </div>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
              {'H\u00e3y l\u00e0m b\u00e0i ki\u1ec3m tra nhanh \u0111\u1ec3 ch\u00fang m\u00ecnh \u0111\u00e1nh gi\u00e1 tr\u00ecnh \u0111\u1ed9 c\u1ee7a b\u1ea1n'}
            </p>
            {/* Icon */}
            <div style={{ margin: '0 auto 40px', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.3)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#wGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs><linearGradient id="wGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#8B5CF6" /></linearGradient></defs>
                <path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
              </svg>
            </div>
            <button onClick={goNext} style={gradientBtn} className="ob-btn">
              {'B\u1eaft \u0111\u1ea7u l\u00e0m b\u00e0i'}
            </button>
            <button onClick={handleSkip} disabled={completeMutation.isPending}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', marginTop: '16px', padding: '8px 16px' }}
              className="ob-btn">
              {'B\u1ecf qua, v\u00e0o Dashboard \u2192'}
            </button>
          </div>
        );

      // ── Quiz (15 questions) ──
      case 1: {
        const progressPct = ((qIdx + (selected !== null ? 1 : 0)) / QUESTIONS.length) * 100;
        const lvColor = levelColors[q.level];

        return (
          <div>
            {/* Top bar: level badge + counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{
                padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                background: `${lvColor}18`, color: lvColor, border: `1px solid ${lvColor}30`,
              }}>
                {q.level} &mdash; {q.hint}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600 }}>
                {`${qIdx + 1} / ${QUESTIONS.length}`}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginBottom: '28px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, #3B82F6, ${lvColor})`, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
            </div>

            {/* Question */}
            <div style={{
              padding: '24px 20px', borderRadius: '16px', background: cardBg,
              border: `1px solid ${borderColor}`, marginBottom: '20px', textAlign: 'center',
            }}>
              <p style={{ color: 'white', fontSize: '20px', fontWeight: 600, lineHeight: 1.5, letterSpacing: '0.3px' }}>
                {q.sentence.split('___').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span style={{
                        display: 'inline-block', minWidth: '80px', borderBottom: '2px solid rgba(59,130,246,0.5)',
                        margin: '0 4px', color: selected !== null ? (selected === q.answer ? STATUS.success : STATUS.danger) : 'rgba(59,130,246,0.6)',
                        fontWeight: 700,
                      }}>
                        {selected !== null ? q.options[selected] : '\u00a0'}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>

            {/* Options (2x2 grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {q.options.map((opt, i) => {
                let bg = cardBg;
                let brd = borderColor;
                let textColor = 'white';
                if (selected !== null) {
                  if (i === q.answer) {
                    bg = 'rgba(34,197,94,0.15)'; brd = STATUS.success; textColor = STATUS.success;
                  } else if (i === selected) {
                    bg = 'rgba(239,68,68,0.15)'; brd = STATUS.danger; textColor = STATUS.danger;
                  } else {
                    textColor = 'rgba(255,255,255,0.3)';
                  }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={selected !== null}
                    style={{
                      padding: '14px 16px', borderRadius: '12px', background: bg,
                      border: `1.5px solid ${brd}`, color: textColor, fontSize: '16px',
                      fontWeight: 600, cursor: selected !== null ? 'default' : 'pointer',
                      transition: 'all 0.2s', textAlign: 'center',
                    }}
                    className="ob-quiz-btn"
                  >
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 400, marginRight: '6px' }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Skip link */}
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={handleSkip} disabled={completeMutation.isPending}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', padding: '6px 12px' }}>
                {'B\u1ecf qua \u2192'}
              </button>
            </div>
          </div>
        );
      }

      // ── Result ──
      case 2: {
        const lc = LEVEL_CONFIG[detectedLevel];
        const pct = Math.round((scores.total / QUESTIONS.length) * 100);
        return (
          <div style={{ textAlign: 'center' }}>
            {/* Score circle */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 24px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke={lc.color} strokeWidth="3"
                  strokeDasharray={`${pct * 0.94} 100`} strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{scores.total}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{`/ ${QUESTIONS.length}`}</span>
              </div>
            </div>

            {/* Detected level */}
            <div style={{
              display: 'inline-block', padding: '6px 20px', borderRadius: '10px', fontSize: '18px', fontWeight: 700,
              background: `${lc.color}18`, color: lc.color, border: `1.5px solid ${lc.color}40`, marginBottom: '12px',
            }}>
              {`Tr\u00ecnh \u0111\u1ed9: ${detectedLevel} \u2014 ${lc.label}`}
            </div>

            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              {scores.total >= 12
                ? 'Xu\u1ea5t s\u1eafc! B\u1ea1n c\u00f3 n\u1ec1n t\u1ea3ng ti\u1ebfng \u0110\u1ee9c r\u1ea5t t\u1ed1t.'
                : scores.total >= 7
                ? 'Kh\u00f4ng t\u1ed3i! B\u1ea1n \u0111\u00e3 c\u00f3 ki\u1ebfn th\u1ee9c c\u01a1 b\u1ea3n.'
                : 'Kh\u00f4ng sao, ch\u00fang m\u00ecnh s\u1ebd b\u1eaft \u0111\u1ea7u t\u1eeb c\u01a1 b\u1ea3n!'}
            </p>

            {/* Per-level breakdown */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px' }}>
              {[
                { lv: 'A1', score: scores.a1, color: STATUS.success },
                { lv: 'A2', score: scores.a2, color: ACCENT.srs },
                { lv: 'B1', score: scores.b1, color: ACCENT.vocab },
              ].map(({ lv, score, color }) => (
                <div key={lv} style={{
                  flex: 1, padding: '14px 8px', borderRadius: '12px', background: cardBg,
                  border: `1px solid ${borderColor}`, textAlign: 'center',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color, marginBottom: '4px' }}>{lv}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>{score}<span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>/5</span></div>
                  {/* mini bar */}
                  <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: color, width: `${(score / 5) * 100}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={goNext} style={gradientBtn} className="ob-btn">
              {'Ti\u1ebfp t\u1ee5c'}
            </button>
          </div>
        );
      }

      // ── Daily Goal ──
      case 3:
        return (
          <div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>
              {'M\u1ee5c ti\u00eau h\u1ecdc m\u1ed7i ng\u00e0y?'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', textAlign: 'center', marginBottom: '32px' }}>
              {'B\u1ea1n mu\u1ed1n h\u1ecdc bao nhi\u00eau t\u1eeb m\u1ed7i ng\u00e0y?'}
            </p>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(139,92,246,0.25)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#gGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs><linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#8B5CF6" /></linearGradient></defs>
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                </svg>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {GOALS.map((g) => {
                const sel = dailyGoal === g.value;
                return (
                  <button key={g.value} onClick={() => setDailyGoal(g.value)}
                    style={{
                      padding: '16px 20px', borderRadius: '14px',
                      background: sel ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : cardBg,
                      border: `1.5px solid ${sel ? 'transparent' : borderColor}`,
                      color: 'white', fontSize: '15px', fontWeight: sel ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.2s', display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', width: '100%',
                      boxShadow: sel ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                    }}
                    className="ob-pill"
                  >
                    <span>{g.label}</span>
                    <span style={{ fontSize: '13px', opacity: sel ? 0.9 : 0.5 }}>{g.sub}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={goNext} disabled={!dailyGoal} style={dailyGoal ? gradientBtn : disabledBtn} className="ob-btn">
              {'Ti\u1ebfp t\u1ee5c'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button onClick={handleSkip} disabled={completeMutation.isPending}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', padding: '6px 12px' }}>
                {'B\u1ecf qua \u2192'}
              </button>
            </div>
          </div>
        );

      // ── Summary ──
      case 4: {
        const lc = LEVEL_CONFIG[detectedLevel];
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
              {'S\u1eb5n s\u00e0ng h\u1ecdc!'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginBottom: '32px' }}>
              {'\u0110\u00e2y l\u00e0 th\u00f4ng tin c\u1ee7a b\u1ea1n'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '36px' }}>
              {/* Level */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${lc.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${lc.color}30` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={lc.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{'Tr\u00ecnh \u0111\u1ed9'}</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {`${detectedLevel} \u2014 ${lc.label}`}
                  </div>
                </div>
              </div>

              {/* Goal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(139,92,246,0.25)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{'M\u1ee5c ti\u00eau h\u00e0ng ng\u00e0y'}</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {`${dailyGoal ?? '---'} t\u1eeb / ng\u00e0y`}
                  </div>
                </div>
              </div>

              {/* Quiz score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderRadius: '16px', background: cardBg, border: `1px solid ${borderColor}` }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(34,197,94,0.25)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginBottom: '2px' }}>{'B\u00e0i ki\u1ec3m tra'}</div>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: 600 }}>
                    {`${scores.total}/${QUESTIONS.length} c\u00e2u \u0111\u00fang`}
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleComplete} disabled={completeMutation.isPending}
              style={{ ...gradientBtn, opacity: completeMutation.isPending ? 0.7 : 1, cursor: completeMutation.isPending ? 'not-allowed' : 'pointer', fontSize: '17px', padding: '16px 32px' }}
              className="ob-btn"
            >
              {completeMutation.isPending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  {'\u0110ang l\u01b0u...'}
                </span>
              ) : (
                'B\u1eaft \u0111\u1ea7u h\u1ecdc ngay!'
              )}
            </button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ob-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(99,102,241,0.5) !important; }
        .ob-btn:active:not(:disabled) { transform: translateY(0); }
        .ob-pill:hover { border-color: rgba(139,92,246,0.4) !important; }
        .ob-quiz-btn:hover:not(:disabled) { border-color: rgba(59,130,246,0.5) !important; background: rgba(59,130,246,0.12) !important; }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, background: '#0a0f1e', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px',
              background: i === step ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : i < step ? ACCENT.srs : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <div style={{
          width: '100%', maxWidth: '480px',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          animation: step === 0 ? 'fadeIn 0.6s ease-out' : undefined,
        }}>
          {renderStep()}
        </div>
      </div>
    </>
  );
}
