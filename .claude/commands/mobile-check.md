# Mobile Check — Verify the mobile project

Run type checking, linting, and diagnostics on the DeutschMeister mobile app.

## Steps

Run these checks sequentially in `e:/Deutsch_App/deutschmeister-mobile/`:

1. **TypeScript check**: `npx tsc --noEmit`
   - Report any type errors with file paths and line numbers
   - Fix simple type errors automatically if possible

2. **Expo Doctor**: `npx expo-doctor`
   - Check for dependency version mismatches
   - Check for configuration issues
   - Report warnings and suggestions

3. **Import validation**: Verify that all `@/` imports resolve correctly
   - Check that no mobile file imports web-only modules (next/navigation, next/link, react-dom)
   - Check that no file imports `'use client'` (should have been stripped)

4. **Missing files check**: Verify that files imported by hooks/API modules exist
   - All `@/lib/api/*` imports should resolve
   - All `@/hooks/*` imports should resolve
   - All `@/types/*` imports should resolve

5. **Report summary**:
   - Total files checked
   - Errors found (with fixes applied)
   - Warnings
   - Missing files or broken imports
