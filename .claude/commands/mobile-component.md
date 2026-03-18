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
- Use NativeWind `className` for styling
- Support dark/light mode via `useColorScheme()` or NativeWind dark: prefix
- Use `Pressable` (not `TouchableOpacity`) for touchable elements
- Add `expo-haptics` feedback on important interactions
- Export as named export AND default export
- Follow the web component's variant/size pattern for consistency:
  ```tsx
  interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
  ```
- Use `react-native-reanimated` for animations (not Animated from react-native)
- Use `@gorhom/bottom-sheet` for bottom sheets/modals
