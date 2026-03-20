# Mobile Fix — Diagnose and fix common mobile app issues

Automatically diagnose and fix common issues in the DeutschMeister mobile app.

## Arguments

$ARGUMENTS — Optional: specific issue to fix (deps, types, metro, build, imports). Default: run all checks.

## Diagnostic Steps

Run these checks in `e:/Deutsch_App/deutschmeister-mobile/`:

### 1. Node.js Compatibility
- Check Node version with `node --version`
- If Node >= 24, ensure `NODE_OPTIONS=--no-experimental-strip-types` is set in all npm scripts
- Verify package.json scripts have the correct NODE_OPTIONS prefix

### 2. Dependency Health (`deps`)
- Run `npm ls --depth=0 2>&1` to check for missing/broken packages
- If errors found, run `npm install --legacy-peer-deps`
- Run `npx expo-doctor` to check Expo SDK compatibility
- Fix any version mismatches reported by expo-doctor

### 3. TypeScript Errors (`types`)
- Run `npx tsc --noEmit 2>&1`
- For each error:
  - Missing imports → add the import
  - Type mismatches → fix the types
  - Missing modules → check if the file exists, create it or update the import
- Report what was fixed

### 4. Metro Bundler Issues (`metro`)
- Clear Metro cache: `NODE_OPTIONS=--no-experimental-strip-types npx expo start --clear`
- Delete `.expo/` cache directory if needed
- Verify `metro.config.js` has NativeWind config

### 5. Build Errors (`build`)
- Check `app.json` for valid configuration
- Verify all expo plugins are installed
- Check that all native modules are compatible with the current Expo SDK version
- Verify `babel.config.js` has NativeWind preset

### 6. Import Validation (`imports`)
- Scan all `.ts`/`.tsx` files for imports
- Check for web-only imports: `next/navigation`, `next/link`, `next/image`, `react-dom`
- Check for `'use client'` directives that should have been stripped
- Verify all `@/` path aliases resolve correctly

## Output

Report a summary:
- Issues found
- Issues fixed automatically
- Issues that need manual intervention
- Recommended next steps
