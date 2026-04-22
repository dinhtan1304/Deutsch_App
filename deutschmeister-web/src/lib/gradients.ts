import { GRADIENT, ACCENT, type GradientKey, type AccentKey } from './tokens';

export { GRADIENT };

export function gradientStyle(key: GradientKey): React.CSSProperties {
  return { backgroundImage: GRADIENT[key] };
}

export function accentShadow(key: AccentKey, alpha = 0x30): string {
  return `0 4px 12px ${ACCENT[key]}${alpha.toString(16).padStart(2, '0')}`;
}

export function accentTintStyle(key: AccentKey, alphaHex = '1A'): React.CSSProperties {
  return { backgroundColor: `${ACCENT[key]}${alphaHex}` };
}
