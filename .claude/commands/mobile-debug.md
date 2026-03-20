# Mobile Debug — Debug mobile app issues

Diagnose and fix runtime issues, crashes, and unexpected behavior in the DeutschMeister mobile app.

## Arguments

$ARGUMENTS — Description of the issue (e.g., "login screen crashes on submit", "games list doesn't load", "blank screen after splash")

## Debugging Process

### 1. Reproduce Understanding
- Parse the user's error description
- Identify the affected screen/component/hook
- Check for related files

### 2. Code Inspection
- Read the affected screen file in `deutschmeister-mobile/app/`
- Read any components it imports from `deutschmeister-mobile/src/components/`
- Read the hooks it uses from `deutschmeister-mobile/src/hooks/`
- Read the API client from `deutschmeister-mobile/src/lib/api/`
- Check for common issues:
  - Missing null checks on API response data
  - Incorrect useQuery/useMutation configuration
  - Wrong API endpoint paths
  - Missing error handling
  - Incorrect navigation paths
  - NativeWind class issues (web-only classes like `hover:`, `cursor-pointer`)

### 3. API Verification
- Check that the API endpoint exists in the backend controller
- Verify request/response types match between mobile and backend
- Check if the endpoint requires authentication
- Compare with the web API client to spot differences

### 4. Common Mobile-Specific Issues
- **Blank screen**: Check for missing SafeAreaView, incorrect layout flex, uncaught errors
- **Crash on navigation**: Check for invalid route paths, missing layout files
- **Data not loading**: Check API URL (EXPO_PUBLIC_API_URL), token refresh, network connectivity
- **Style issues**: NativeWind doesn't support all Tailwind classes — check for web-only utilities
- **Font not loading**: Check `expo-font` installed, fonts loaded in `app/_layout.tsx`, fontFamily uses correct name (e.g., `Quicksand_700Bold`, `Nunito_400Regular`)
- **Wrong colors**: Verify using theme tokens from `@/theme`, not hardcoded hex. Old colors (#c9f53b, #080810) replaced by Zen Focus palette
- **Animation issues**: Ensure using `react-native-reanimated`, not `Animated`
- **Keyboard issues**: Check `KeyboardAvoidingView` behavior prop for iOS vs Android
- **Infinite re-renders**: Check dependency arrays, zustand selectors, query key stability

### 5. Fix & Verify
- Apply the fix
- Run `npx tsc --noEmit` to verify no type errors
- Explain the root cause and fix to the user

## Unsupported NativeWind Classes (common gotchas)
- `hover:*`, `focus:*`, `group-hover:*` — no hover on mobile
- `cursor-pointer` — not applicable
- `backdrop-blur-*` — limited support
- `transition-*` — use reanimated instead
- `grid-cols-*` — limited, use flexbox instead
- `ring-*` — not supported
- `divide-*` — not supported
- `scroll-smooth` — not applicable
