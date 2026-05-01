/* eslint-disable no-restricted-syntax */
import type { CSSProperties } from 'react';

export const cardBg = 'rgba(255,255,255,0.05)';
export const borderColor = 'rgba(255,255,255,0.1)';

export const gradientBtn: CSSProperties = {
  padding: '14px 32px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
  color: 'white',
  fontWeight: 700,
  fontSize: '15px',
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  width: '100%',
};

export const disabledBtn: CSSProperties = { ...gradientBtn, opacity: 0.5, cursor: 'not-allowed' };
