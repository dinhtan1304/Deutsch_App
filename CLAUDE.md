# DeutschMeister

German learning app — Next.js 15 frontend + NestJS 10 API (Prisma/PostgreSQL).

This file is auto-loaded into every Claude Code session at this repo root. Keep it concise — hand off detail to skills under `.claude/skills/`.

## Workspaces (in scope)

| Path | Stack | Deploy |
|---|---|---|
| `deutschmeister-web/` | Next.js 15 App Router, Tailwind v4, Zustand, TanStack Query | Vercel |
| `deutschmeister-api/` | NestJS 10, Prisma, PostgreSQL, Socket.IO | Railway |

`deutschmeister-api/` is a **git submodule** with default branch `master` (not `main`). Two other workspaces exist in the repo (`deutschmeister-mobile/`, `deutschmeister-tts/`) but are not covered here — mobile has its own `/mobile-*` skills.

## Common commands

**Web** (run from `deutschmeister-web/`):

```bash
npm run dev          # Next dev server on :3000
npm run build        # production build (includes typecheck)
npm run lint         # ESLint
npm run lint:strict  # fail on warnings (CI)
```

**API** (run from `deutschmeister-api/`):

```bash
npm run start:dev    # nest watch mode
npm run build        # nest build
npm run test         # Jest
npm run db:push      # sync Prisma schema (do NOT use db:migrate in dev)
npm run db:studio    # Prisma Studio
npm run db:seed      # seed initial data
```

## Submodule rule (read before pushing)

`deutschmeister-api` is referenced by SHA from the parent repo. The parent push does NOT verify the SHA exists on the submodule's remote — you can push parent `main` pointing at a submodule commit that only exists locally, and deploy will fail with "object not found".

- Default branch in the submodule is **`master`**, not `main`.
- Always push submodule BEFORE parent:
  ```bash
  git -C deutschmeister-api push origin master
  git push origin main
  ```
- Local config has `push.recurseSubmodules=check` — parent push will refuse if a referenced submodule commit isn't on the submodule remote. This is a safety net, not a bug.
- Full workflow: load skill `git-flow`.

## When to invoke a skill

| Situation | Skill |
|---|---|
| New branch, commit, merge, deploy, anything touching the submodule | `git-flow` |
| Creating/modifying components, pages, hooks, styling, navigation in `deutschmeister-web/` | `web-design-system` |
| Code review or security review on pending changes | `review` / `security-review` |

**Branch naming is mandatory**: `tandv_update_{plan}` — kebab-case slug, no diacritics, no `/`. Examples: `tandv_update_arena`, `tandv_update_payment-fix`. Skill `git-flow` enforces this.

## Core conventions

- **API client**: import `apiGet | apiPost | apiPut | apiPatch | apiDelete | api` directly from `@/lib/api/client`. Do NOT wrap in a custom `apiClient`. Do NOT call `fetch` or `axios` from components.
- **Auth token**: access token is held **in memory only** (see `setAccessToken` / `getAccessToken` in `client.ts`). Refresh token lives in an httpOnly cookie. Never store access token in `localStorage`.
- **Server state**: TanStack Query. Hooks under `src/hooks/useXxx.ts`, query keys namespaced (e.g. `dashboardKeys`, `wordKeys`).
- **UI state**: Zustand. One store file per domain in `src/stores/`.
- **Page components**: must start with `'use client'`.
- **Route params**: `useParams<{ id: string }>()`.
- **Styling**: use tokens from `@/lib/tokens` (`ACCENT`, `GRADIENT`, `RADIUS`, `SHADOW`, `SPACING`) or `var(--theme-*)` CSS vars. No raw hex/gradient strings in JSX. Detail in skill `web-design-system`.
- **Navigation**: single source of truth at `deutschmeister-web/src/config/navigation.tsx`. Sidebar (desktop) and BottomTabBar (mobile web) both render from this — never duplicate nav items elsewhere.
- **DB schema changes**: run `npm run db:push` in `deutschmeister-api/`. Do not create migration files locally in dev.

## Anti-patterns

- `import { apiClient } from ...` — does not exist; use `apiGet/apiPost/...`
- `style={{ background: '#6366F1' }}` — use `style={{ background: ACCENT.writing }}` or `className="bg-accent-writing"`
- `style={{ background: 'linear-gradient(...)' }}` — use `GRADIENT.<feature>`
- Branch named `feature/x`, `fix-bug-123`, etc. — must be `tandv_update_{plan}`
- `git push origin main` without first pushing submodule `master`
- `git rebase main` on a branch that has been pushed — use `git merge origin/main` instead
- Reordering or sorting imports/exports in `src/components/ui/index.ts` or `src/config/navigation.tsx` — append at the end of the block to avoid merge conflicts with parallel branches
- Storing `accessToken` in `localStorage` or any persistent storage
- Creating new Markdown docs (`*.md`, `docs/`) unless the user explicitly asks for them

## Conflict-prone files (touch with care, sync `origin/main` before editing)

`src/stores/authStore.ts`, `src/config/navigation.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/ui/index.ts`, `src/app/globals.css`, `next.config.ts`, `deutschmeister-api/prisma/schema.prisma`, `deutschmeister-api/src/app.module.ts`. Full strategy: skill `git-flow` section 4.

## Where to find more

- Feature catalog with priorities: [FEATURES_LIST.md](FEATURES_LIST.md)
- Git workflow + submodule + conflict map: [.claude/skills/git-flow/SKILL.md](.claude/skills/git-flow/SKILL.md)
- Design system (tokens, primitives, FE checklist): [.claude/skills/web-design-system/SKILL.md](.claude/skills/web-design-system/SKILL.md)
- Workspace READMEs: `deutschmeister-web/README.md`, `deutschmeister-api/README.md`
- Skill list: `/help` or [.claude/skills/](.claude/skills/)
