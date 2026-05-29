'use client';
/* eslint-disable no-restricted-syntax -- custom UI gradients */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCompleteOnboarding } from '@/hooks/useOnboarding';
import { ACCENT } from '@/lib/tokens';
import { QUESTIONS, determineLevel } from './_data';
import { StepWelcome } from './_components/StepWelcome';
import { StepQuiz } from './_components/StepQuiz';
import { StepResult } from './_components/StepResult';
import { StepGoal } from './_components/StepGoal';
import { StepSummary } from './_components/StepSummary';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const completeMutation = useCompleteOnboarding();

  const [step, setStep] = useState(0);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const answerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(true);

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

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user?.onboardingCompleted !== false) { router.replace('/dashboard'); }
  }, [_hasHydrated, isAuthenticated, user, router]);

  useEffect(() => () => { if (answerTimer.current) clearTimeout(answerTimer.current); }, []);

  const goNext = useCallback(() => {
    setVisible(false);
    setTimeout(() => { setStep((s) => s + 1); setVisible(true); }, 300);
  }, []);

  const handleAnswer = useCallback((optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    const correct = optIdx === QUESTIONS[qIdx]!.answer;
    setAnswers((prev) => [...prev, correct]);

    answerTimer.current = setTimeout(() => {
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx((i) => i + 1);
        setSelected(null);
      } else {
        setVisible(false);
        setTimeout(() => { setStep(2); setVisible(true); }, 300);
      }
    }, 900);
  }, [selected, qIdx]);

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

  if (!_hasHydrated || !isAuthenticated || user?.onboardingCompleted !== false) {
    return <div style={{ minHeight: '100vh', background: '#0a0f1e' }} />;
  }

  const q = QUESTIONS[qIdx];
  const TOTAL_STEPS = 5;

  const renderStep = () => {
    switch (step) {
      case 0:
        return <StepWelcome userName={user?.name} isPending={completeMutation.isPending} onNext={goNext} onSkip={handleSkip} />;
      case 1:
        if (!q) return null;
        return <StepQuiz q={q} qIdx={qIdx} totalQuestions={QUESTIONS.length} selected={selected} isPending={completeMutation.isPending} onAnswer={handleAnswer} onSkip={handleSkip} />;
      case 2:
        return <StepResult detectedLevel={detectedLevel} scores={scores} totalQuestions={QUESTIONS.length} onNext={goNext} />;
      case 3:
        return <StepGoal dailyGoal={dailyGoal} isPending={completeMutation.isPending} onSetGoal={setDailyGoal} onNext={goNext} onSkip={handleSkip} />;
      case 4:
        return <StepSummary detectedLevel={detectedLevel} dailyGoal={dailyGoal} scores={scores} totalQuestions={QUESTIONS.length} isPending={completeMutation.isPending} onComplete={handleComplete} />;
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
