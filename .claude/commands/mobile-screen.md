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
- **Theme**: Zen Focus Dark Mode — use `colors`, `spacing`, `radius`, `typography` from `@/theme`
- **Fonts**: Every `Text` style MUST have `fontFamily` from `typography.fontFamily.*` (heading/body variants)
- **Colors**: `colors.bg.b0` (background), `colors.bg.b2` (surface/cards), `colors.pastel.lime.base` (CTA)
- **Border radius**: `radius.stone` (24px) for cards, `radius.pill` for buttons
- Use `<Ionicons>` from `@expo/vector-icons` for icons
- Loading state: Use `Skeleton` component from `@/components/ui/Skeleton`
- Lists: use `<FlatList>` for long lists (not `.map()` in ScrollView)
- Pull-to-refresh: add `refreshControl` to ScrollView/FlatList
- Haptic feedback on important button presses via `expo-haptics`
- Tab bar is floating pill style — add `paddingBottom: 80` to scroll content for clearance
