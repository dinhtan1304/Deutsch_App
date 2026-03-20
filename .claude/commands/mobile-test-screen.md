# Mobile Test Screen — Manually verify a screen works correctly

Verify a mobile screen by checking its code for common issues, testing data flow, and ensuring all user interactions are handled.

## Arguments

$ARGUMENTS — Screen path to verify (e.g., "games/flashcards", "practice/reading", "more/settings")

## Process

### 1. Read the Screen
- Read `deutschmeister-mobile/app/(tabs)/{path}.tsx`
- List all hooks, components, and API calls it uses

### 2. Verify Data Flow
- Read each hook used → verify it calls the correct API endpoint
- Read each API client function → verify the endpoint path and request/response types
- Cross-check with backend controller to ensure endpoints exist and types match
- Check that loading, error, and empty states are all handled

### 3. Check Navigation
- Verify all `router.push()` / `router.back()` calls use valid routes
- Check that route params are correctly passed and received
- Verify the screen is registered in its parent `_layout.tsx`

### 4. Check UI/UX Patterns
- `SafeAreaView` wrapping with correct edges
- Pull-to-refresh on data screens
- Loading skeleton or `ActivityIndicator`
- Error state with retry button
- Empty state with helpful message
- Keyboard handling for forms (`KeyboardAvoidingView`)
- Haptic feedback on key interactions
- Correct use of `FlatList` vs `ScrollView` for lists

### 5. Check for Common Bugs

- Missing `key` prop on mapped elements
- Incorrect conditional rendering (falsy 0 showing as text)
- Missing null/undefined checks on API data
- Stale closures in callbacks (missing deps)
- NativeWind classes that don't work on mobile (hover:, cursor-pointer, etc.)
- Hardcoded colors that should use theme tokens from `@/theme`
- Missing `fontFamily` on Text styles (every Text MUST have `fontFamily` from `typography.fontFamily.*`)
- Old hex colors (e.g., `#c9f53b`, `#080810`, `#6366F1`) — should use Zen Focus tokens
- Cards not using `radius.stone` (24px) for border radius
- Touch targets smaller than 48x48px
- Body text not using lineHeight 1.6

### 6. Report
- Screen status: PASS / ISSUES FOUND
- List any issues with severity (critical/warning/info)
- Suggest fixes for each issue
