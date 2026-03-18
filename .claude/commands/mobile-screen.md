# Mobile Screen — Convert a web page to a React Native screen

Convert a Next.js page from `deutschmeister-web/` into an Expo Router screen for `deutschmeister-mobile/`.

## Arguments

$ARGUMENTS — The web page path to convert (e.g., `dashboard`, `games/quick-quiz`, `practice-test/reading/exam/new`)

## Process

1. **Read the web page** at `deutschmeister-web/src/app/{path}/page.tsx`
2. **Analyze** the page structure:
   - What hooks does it use? (data fetching, navigation, state)
   - What components does it render? (cards, lists, forms, charts)
   - What user interactions does it handle? (clicks, form submissions, navigation)
3. **Map to React Native equivalents**:
   - `<div>` → `<View>`
   - `<p>`, `<span>`, `<h1-h6>` → `<Text>` with appropriate styles
   - `<input>` → `<TextInput>`
   - `<button>` → `<Pressable>` or custom `<Button>`
   - `<a>` / `<Link>` → `router.push()` or `<Link>` from expo-router
   - `<img>` → `<Image>` from react-native
   - `<ul>` / mapped lists → `<FlatList>` or `<ScrollView>`
   - `useRouter()` → `useRouter()` from expo-router
   - `useParams()` → `useLocalSearchParams()` from expo-router
   - `useSearchParams()` → `useLocalSearchParams()` from expo-router
   - Tailwind HTML classes → NativeWind classes (mostly same syntax)
   - `onClick` → `onPress`
   - `onChange` → `onChangeText` (for TextInput)
   - `style={{ var(--theme-*) }}` → use dark/light theme classes or useColorScheme()
4. **Keep all business logic** (hooks, API calls, state management) identical
5. **Write the screen** to `deutschmeister-mobile/app/{mapped-path}.tsx`
6. **Create any missing components** referenced by the screen in `deutschmeister-mobile/src/components/`

## Conventions

- Wrap screens with `<SafeAreaView>` from `react-native-safe-area-context`
- Use `className` with NativeWind (Tailwind) classes
- Use `useColorScheme()` for dark/light mode
- Use `<Ionicons>` from `@expo/vector-icons` for icons (map web SVG icons to closest Ionicons name)
- Loading state: `<ActivityIndicator>` centered in the screen
- Error state: custom `<ErrorView>` component with retry button
- Lists: use `<FlatList>` for long lists (not `.map()` in ScrollView)
- Pull-to-refresh: add `refreshControl` to ScrollView/FlatList
- Haptic feedback on important button presses via `expo-haptics`
