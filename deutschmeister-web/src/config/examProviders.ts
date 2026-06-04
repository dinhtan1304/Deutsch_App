/**
 * Single source of truth for exam providers × CEFR levels on the web.
 *
 * The 4 exam setup wizards (reading/writing/listening/speaking) render their
 * provider chips and level buttons from this matrix instead of hardcoding lists
 * + ad-hoc exclusions. A provider/level pair is only actually selectable when a
 * matching entry also exists in `EXAM_*_DISPLAY` (see `@/lib/examConfig`); the
 * wizard gates the "create" button on that, so listing a level here that has no
 * display config yet renders it disabled rather than broken.
 *
 * Mirrors the backend `src/common/constants/exam-providers.ts`.
 *
 * Labels/descriptions live in i18n under `practice.examCommon.setup` — only the
 * key names are referenced here.
 */

export type ExamProvider = 'GOETHE' | 'TELC' | 'OESD' | 'TESTDAF';
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

/** Canonical ascending order used to sort the level buttons. */
export const CEFR_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

export interface ExamProviderMeta {
  id: ExamProvider;
  /** i18n key under `practice.examCommon.setup` for the chip label. */
  labelKey: string;
  /** i18n key under `practice.examCommon.setup` for the chip description. */
  descKey: string;
  /** CSS accent var used for the selected chip. */
  color: string;
  /** Levels this provider offers in the app. */
  levels: CefrLevel[];
}

export const EXAM_PROVIDERS: ExamProviderMeta[] = [
  { id: 'GOETHE', labelKey: 'goetheLabel', descKey: 'goetheDesc', color: 'var(--der)',    levels: ['A1', 'A2', 'B1', 'B2', 'C1'] },
  { id: 'TELC',   labelKey: 'telcLabel',   descKey: 'telcDesc',   color: 'var(--violet)', levels: ['A2', 'B1', 'B2', 'C1'] },
  { id: 'OESD',    labelKey: 'osdLabel',     descKey: 'osdDesc',     color: 'var(--cyan)',   levels: ['A1', 'A2', 'B1', 'B2', 'C1'] },
  { id: 'TESTDAF', labelKey: 'testdafLabel', descKey: 'testdafDesc', color: 'var(--die)',    levels: ['B2', 'C1'] },
];

/** Levels offered by a given provider (empty if unknown). */
export function providerLevels(id: string): CefrLevel[] {
  return EXAM_PROVIDERS.find((p) => p.id === id)?.levels ?? [];
}

/**
 * Union of every level any provider offers, in canonical order — the full set
 * of level buttons a wizard renders (those outside the current provider's set
 * are shown disabled).
 */
export const VISIBLE_LEVELS: CefrLevel[] = CEFR_ORDER.filter((lvl) =>
  EXAM_PROVIDERS.some((p) => p.levels.includes(lvl)),
);

/**
 * When switching provider, return a still-valid level: keep `current` if the
 * provider supports it, otherwise fall back to the provider's first level.
 */
export function coerceLevel(providerId: string, current: string): CefrLevel {
  const levels = providerLevels(providerId);
  return (levels.includes(current as CefrLevel) ? (current as CefrLevel) : levels[0]) ?? 'B1';
}
