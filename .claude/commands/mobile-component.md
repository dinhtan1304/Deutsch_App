# Mobile Component — Create a React Native component

Create a React Native component for `deutschmeister-mobile/` based on an existing web component or a description.

## Arguments

$ARGUMENTS — Either a web component path (e.g., `ui/Button`, `dashboard/StatsCards`) or a description of the component to create

## Process

### If converting from web component:

1. **Read** the web component at `deutschmeister-web/src/components/{path}.tsx`
2. **Analyze** its props interface, state, and rendering logic
3. **Convert** to React Native:
   - HTML elements → RN components (View, Text, Pressable, etc.)
   - CSS/Tailwind → NativeWind classes
   - Event handlers: onClick → onPress, onChange → onChangeText
   - Animations: CSS transitions → `react-native-reanimated`
   - SVG icons → `<Ionicons>` from `@expo/vector-icons`
4. **Keep** the same TypeScript props interface
5. **Write** to `deutschmeister-mobile/src/components/{path}.tsx`

### If creating from description:

1. Create the component following project conventions
2. Use TypeScript with explicit prop types
3. Write to the appropriate location in `deutschmeister-mobile/src/components/`

## Component Conventions

- Always use TypeScript with explicit `interface Props`
- **Theme**: Import `colors`, `spacing`, `radius`, `typography` from `@/theme`
- **Fonts**: Every `Text` style MUST have `fontFamily` from `typography.fontFamily.*`:
  - Headings: `typography.fontFamily.heading` (Quicksand Bold)
  - Body: `typography.fontFamily.body` (Nunito Regular), `.bodyBold`, `.bodySemibold`, etc.
  - Match fontFamily to fontWeight: black→bodyBlack, bold→bodyBold, semibold→bodySemibold
- **Border radius**: `radius.stone` (24px) for cards, `radius.pill` for pills/buttons
- **Shadows**: `zenGlow` for sage glow effect, `floatShadow` for elevated elements
- Use `Pressable` (not `TouchableOpacity`) for touchable elements
- Add `expo-haptics` feedback on important interactions
- Export as named export AND default export
- Existing reusable components: `PastelCard`, `PrimaryButton`, `GhostButton`, `GenderBadge`, `QuizOption`, `EmptyState`, `Skeleton`, `XPSummary`, `ComboBadge`, `SRSChip`
- Use `react-native-reanimated` for animations (not Animated from react-native)
- Use `@gorhom/bottom-sheet` for bottom sheets/modals
