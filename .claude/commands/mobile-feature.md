# Mobile Feature — Add a new feature to the mobile app

Add a complete feature to the DeutschMeister mobile app, including API client, hook, screen, and navigation.

## Arguments

$ARGUMENTS — Description of the feature to add (e.g., "notifications settings screen", "word of the day widget", "offline mode for flashcards")

## Process

### 1. Analyze the Feature
- Determine if a corresponding web feature exists in `deutschmeister-web/`
- Identify which API endpoints are needed (check `deutschmeister-api/` if unsure)
- Plan the file structure

### 2. Create API Client (if needed)
- File: `deutschmeister-mobile/src/lib/api/{feature}.ts`
- Follow the pattern from existing API clients (use `apiGet`, `apiPost`, `apiDelete` from `./client`)
- Export typed functions for each endpoint
- Add types to `src/types/` if needed

### 3. Create React Query Hook (if needed)
- File: `deutschmeister-mobile/src/hooks/use{Feature}.ts`
- Follow the pattern from existing hooks
- Include query keys factory
- Add mutations with `onSuccess` invalidation
- Export all hooks and query keys

### 4. Create Screen(s)
- File: `deutschmeister-mobile/app/(tabs)/{appropriate-tab}/{feature}.tsx`
- Use `SafeAreaView` wrapper with `edges={['top']}`
- Include loading skeleton, error state, empty state
- Use NativeWind classes for styling
- Use `useColorScheme()` for dark/light mode if needed
- Add pull-to-refresh where appropriate
- Use `FlatList` for lists, `ScrollView` for static content

### 5. Create Components (if needed)
- File: `deutschmeister-mobile/src/components/{feature}/{Component}.tsx`
- TypeScript with explicit `interface Props`
- Support dark/light mode
- Add haptic feedback on key interactions

### 6. Update Navigation (if needed)
- Add route to appropriate tab `_layout.tsx`
- Add navigation link from parent screen

## Conventions

- **Theme**: Zen Focus Dark Mode — forest-green backgrounds, muted earthy accents
- **Colors**: Import from `@/theme` — `colors.bg.b0` (bg), `colors.bg.b2` (surface), `colors.pastel.lime.base` (#8EAD92, CTA)
- **Fonts**: Quicksand for headings (`typography.fontFamily.heading`), Nunito for body (`typography.fontFamily.body`). Every `Text` style MUST have a `fontFamily` property
- **Border radius**: `radius.stone` (24px) for cards, `radius.pill` (999px) for buttons
- **Shadows**: Use `zenGlow` and `floatShadow` from `@/theme` for elevated elements
- Use `Ionicons` from `@expo/vector-icons` for icons
- Haptic feedback: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)` on buttons
- Vietnamese UI text, German learning content
- Follow existing patterns — read similar screens before writing new ones
