/* eslint-disable no-restricted-syntax */
/**
 * Cover background presets used by ProfileEditModal + ProfileHeroCard.
 * Stored on User.coverImage as `preset:<id>` strings; absent or non-preset
 * values are treated as image URLs.
 */
export const COVER_PRESETS = {
  indigo: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E1B4B 100%)',
  sunset: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #BE185D 100%)',
  emerald: 'linear-gradient(135deg, #064E3B 0%, #10B981 50%, #064E3B 100%)',
  rose: 'linear-gradient(135deg, #BE185D 0%, #F472B6 50%, #FECDD3 100%)',
  slate: 'linear-gradient(135deg, #0F172A 0%, #334155 50%, #0F172A 100%)',
  amber: 'linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #FCD34D 100%)',
  violet: 'linear-gradient(135deg, #4C1D95 0%, #8B5CF6 50%, #C4B5FD 100%)',
  cyan: 'linear-gradient(135deg, #0E7490 0%, #06B6D4 50%, #67E8F9 100%)',
} as const satisfies Record<string, string>;

export type CoverPresetId = keyof typeof COVER_PRESETS;

export const DEFAULT_COVER_PRESET: CoverPresetId = 'indigo';

export const PRESET_PREFIX = 'preset:';

export const isPresetCover = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.startsWith(PRESET_PREFIX);

export const presetIdFromCover = (value: string | null | undefined): string | null => {
  if (!isPresetCover(value)) return null;
  return value!.slice(PRESET_PREFIX.length);
};

/**
 * Resolve a User.coverImage value into either a CSS background gradient or
 * an absolute image URL. Returns the gradient for the default preset when
 * value is empty/unknown.
 */
export const resolveCoverBackground = (
  value: string | null | undefined,
): { kind: 'gradient'; css: string } | { kind: 'image'; url: string } => {
  const presetId = presetIdFromCover(value);
  if (presetId && presetId in COVER_PRESETS) {
    return { kind: 'gradient', css: COVER_PRESETS[presetId as CoverPresetId] };
  }
  if (typeof value === 'string' && value.length > 0 && !value.startsWith(PRESET_PREFIX)) {
    return { kind: 'image', url: value };
  }
  return { kind: 'gradient', css: COVER_PRESETS[DEFAULT_COVER_PRESET] };
};
