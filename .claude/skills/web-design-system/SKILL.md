---
name: web-design-system
description: Enforces DeutschMeister web design system conventions. Use when creating or modifying components, pages, styles, hooks, or navigation in the deutschmeister-web/ Next.js 15 app. Covers tokens, primitives, state patterns, navigation contract, anti-patterns, and a self-check before marking FE work done.
---

# DeutschMeister Web Design System

Single source of truth for visual + code conventions in `deutschmeister-web/`. Follow these rules whenever touching FE code.

## 1. Brand & Tokens

All colors, gradients, radii, shadows, spacing, typography come from ONE of:
- TypeScript: `import { ACCENT, GRADIENT, RADIUS, SHADOW, SPACING, FONT_SIZE } from '@/lib/tokens'`
- CSS: `var(--theme-*)`, `var(--color-accent-*)`, `var(--radius-*)`, `var(--shadow-*)`
- Tailwind: utilities generated from the `@theme` block in `src/app/globals.css`

**Brand:** `ACCENT.brand` = `#4F46E5` (indigo-600) — primary interactive, default for Buttons.

**Feature accents** (see `src/lib/tokens.ts`):
- `reading`, `writing`, `listening`, `speaking` — four core skills
- `vocab` — vocabulary learning
- `games`, `srs`, `xp`, `premium` — supporting contexts

**Scales:**
- Radius: `sm | md | lg | pill` only — no custom values
- Shadow: `none | soft | lifted` only — 3 levels
- Spacing: Tailwind 4-scale (`p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16`). NEVER use arbitrary values like `p-[28px]` or `padding: '28px 24px'`.
- Typography: 6 sizes — `caption 12 | body 14 | lead 16 | h3 18 | h2 22 | h1 28`. Weights `400 | 600` only (700 allowed for h1).

## 2. Primitives catalog

Live under `src/components/ui/`. Import from there; do not roll your own.

| Primitive | Use when |
|-----------|----------|
| `<Card variant="default\|bordered\|elevated">` | any card surface |
| `<ActionCard>` | dashboard "do this next" hero with CTA + optional progress + optional task chips |
| `<FeatureCard>` | feature showcase (landing, dashboard skill cards) |
| `<PlanCard>` | pricing tier — data-driven, pass plan config |
| `<FormLayout>` + `<FormField>` | auth forms (login, register, forgot, reset) |
| `<StatusPill type="streak\|xp\|level">` | streak / XP / level displays |
| `<Button variant accent size>` | all clickable actions |
| `<Input>` | raw input (wrapped by FormField — prefer FormField in forms) |

**Rule:** if a JSX pattern appears 3+ times across pages, extract into a primitive before adding it a 4th time.

## 3. State & data conventions

- **Server state:** TanStack Query. Hooks under `src/hooks/useXxx.ts`, query keys namespaced (see `dashboardKeys`, `wordKeys`).
- **UI state:** Zustand stores under `src/stores/`, one file per domain (authStore, srsStore, wordBankStore, …).
- **API calls:** import `apiGet / apiPost / apiDelete / api` directly from `src/lib/api/client.ts`. NEVER wrap in a custom `apiClient` abstraction. NEVER use `fetch` or `axios` directly in components.
- **Access token:** lives in memory only (set via client.ts on login/refresh). Do not try to store it in localStorage — the refresh-token cookie + in-memory pattern is deliberate.

## 4. Navigation contract

- Single source of truth: `src/config/navigation.ts` exports `PRIMARY_NAV`. (File created in Phase 2.)
- Both `Sidebar.tsx` (desktop) and `BottomTabBar.tsx` (mobile) MUST render from this array — do not duplicate nav items in each component.
- Route naming: prefer `/vocabulary/*`, `/practice/*`, `/progress/*` segmenting. Legacy routes (`/words`, `/word-bank`, `/practice-test`, `/profile`) are being migrated in Phase 2+.

## 5. Anti-patterns → correct form

| Anti-pattern | Replace with |
|---|---|
| `style={{ background: '#6366F1' }}` | `style={{ background: ACCENT.writing }}` or `className="bg-accent-writing"` |
| `style={{ background: 'linear-gradient(135deg, ...)' }}` | `style={{ background: GRADIENT.writing }}` |
| `style={{ padding: '28px 24px' }}` | `className="p-6"` or `p-6 px-6` — 24px maps to `p-6` in Tailwind |
| `style={{ borderRadius: 16 }}` | `className="rounded-lg"` or `style={{ borderRadius: RADIUS.lg }}` |
| Custom `<div>` that looks like a card | `<Card>` or specific primitive (ActionCard, FeatureCard, PlanCard) |
| Inline `@keyframes` inside a page `.tsx` | Move to `globals.css` (shared), or reuse existing animation classes |
| `<input>` + `<label>` + focus `useState` in auth | `<FormField label icon />` |
| Duplicating Header/Sidebar navigation items | Edit `PRIMARY_NAV` in `src/config/navigation.ts` |
| Hardcoded plan JSX for Free/Premium/Lifetime | `<PlanCard plan={PLAN_CONFIG.premium} recommended />` |

## 6. Review checklist

Run through this before considering an FE task done:

- [ ] No hex literal (`#[0-9a-fA-F]{3,8}`) in changed `.tsx` files — grep your diff
- [ ] No inline `linear-gradient(...)` in changed `.tsx` files
- [ ] Every card-like surface uses `<Card>` or a specific primitive
- [ ] Spacing values map to Tailwind 4-scale (no `p-[Npx]` arbitrary values)
- [ ] Navigation changes go to `src/config/navigation.ts`, not Sidebar/BottomTabBar directly
- [ ] New components live in `src/components/ui/` if reusable, `src/components/<domain>/` if feature-scoped
- [ ] `cd deutschmeister-web && pnpm lint` surfaces no NEW warnings in changed files
- [ ] `pnpm build` passes (TypeScript + Next build)
- [ ] Visual sanity: both light and dark theme render cleanly (test by toggling `data-theme` on `<html>`)

## 7. When blocked or uncertain

- Before creating a new component, grep `src/components/ui/` and `src/components/<domain>/` for an existing one that could extend. Reuse over duplicate.
- If a design token is missing for a legitimate need, add it to `src/lib/tokens.ts` + `src/app/globals.css` in one change — do not inline.
- If a page needs a layout not covered by `MainLayout`, check if it's a "bare" route (auth, landing, admin) — list in `MainLayout.tsx` BARE_ROUTES array.
