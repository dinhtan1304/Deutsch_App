'use client';

import { useState, useEffect } from 'react';
import { useCelebrationStore } from '@/stores/celebrationStore';

const CONFETTI_COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

export function CelebrationModal() {
  const current = useCelebrationStore((s) => s.queue[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (current) {
      // Small delay to trigger CSS transition (mount → animate in)
      const timer = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [current]);

  if (!current) return null;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => {
      useCelebrationStore.getState().dismiss();
    }, 250);
  };

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          from {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translateY(80vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Confetti particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `calc(${(i * 5) % 100}% + ${(i * 7) % 20 - 10}px)`,
              width: 6,
              height: 6,
              borderRadius: 1,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animation: `confetti-fall 2s ease-in forwards`,
              animationDelay: `${(i * 0.1) % 1.5}s`,
              opacity: 0,
            }}
          />
        ))}

        {/* Card */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 360,
            width: '90%',
            background: 'var(--theme-bg-primary)',
            border: '1px solid var(--theme-border)',
            borderRadius: 24,
            padding: 32,
            textAlign: 'center',
            transform: visible ? 'scale(1)' : 'scale(0.8)',
            opacity: visible ? 1 : 0,
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 16 }}>
            {current.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--theme-text-primary)',
              marginBottom: 4,
            }}
          >
            {current.nameVi}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 14,
              color: 'var(--theme-text-muted)',
              marginBottom: 20,
            }}
          >
            Th&#224;nh t&#237;ch &#273;&#227; m&#7903; kh&#243;a!
          </p>

          {/* Gradient divider */}
          <div
            style={{
              height: 2,
              borderRadius: 1,
              background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
              marginBottom: 20,
            }}
          />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Tuy&#7879;t v&#7901;i!
          </button>
        </div>
      </div>
    </>
  );
}
