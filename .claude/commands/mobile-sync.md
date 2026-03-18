# Mobile Sync — Copy shared files from web to mobile

Sync shared TypeScript files (API clients, hooks, types) from `deutschmeister-web/src/` to `deutschmeister-mobile/src/`.

## Rules

1. **Copy verbatim** (no changes needed):
   - All files in `deutschmeister-web/src/lib/api/*.ts` EXCEPT `client.ts` → `deutschmeister-mobile/src/lib/api/`
   - All files in `deutschmeister-web/src/hooks/*.ts` EXCEPT `useSoundEffects.ts`, `usePronunciation.ts`, `useTheme.ts`, `useWordHighlight.ts` → `deutschmeister-mobile/src/hooks/`
   - All files in `deutschmeister-web/src/types/*.ts` → `deutschmeister-mobile/src/types/`
   - `deutschmeister-web/src/lib/examConfig.ts` → `deutschmeister-mobile/src/lib/examConfig.ts`

2. **Strip `'use client'`** directives from all copied files (React Native does not use this).

3. **Do NOT overwrite** these mobile-specific files:
   - `src/lib/api/client.ts` (mobile version uses expo-secure-store)
   - `src/stores/authStore.ts` (mobile version uses MMKV)
   - `src/stores/settingsStore.ts` (mobile version uses MMKV + Appearance API)

4. After copying, report:
   - Number of files copied
   - Any files that were skipped (already exist and have mobile-specific changes)
   - Any import path issues found (e.g., imports that reference web-only modules)

## Execution

For each source file:
1. Read the web version
2. Remove `'use client';` line if present
3. Check if the mobile version already exists — if it does, compare and skip if mobile has custom changes
4. Write to the corresponding mobile path
5. Verify no broken imports (all `@/lib/api/client` imports should resolve to the mobile client.ts)
