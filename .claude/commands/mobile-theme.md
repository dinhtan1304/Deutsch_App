# Mobile Theme — Update theme and styling across the mobile app

Update colors, fonts, spacing, or other theme settings across the DeutschMeister mobile app.

## Arguments

$ARGUMENTS — What to change (e.g., "update primary color", "add new feature color", "update card background")

## Theme System — Zen Focus Dark Mode

### Design Tokens (Source of Truth)
All visual tokens are defined in `deutschmeister-mobile/src/theme/tokens.json` and exported via `src/theme/index.ts`.

### Color Palette

**Base backgrounds (forest-green tones):**
- `b0`: `#1A2421` — App background (Deep Forest Night)
- `b1`: `#1F2B27` — Page background
- `b2`: `#25332E` — Card / surface
- `b3`: `#2D3E38` — Input / nested surface
- `b4`: `#354842` — Hover / elevated surface

**Pastel accents (muted, earthy):**
- `lime`: `#8EAD92` — Primary CTA (Muted Sage Green)
- `mint`: `#7BC88C` — Correct state, learned words, noun "das"
- `lavender`: `#B8A9D4` — Level, profile, active tab
- `sky`: `#8BB5CF` — Noun "der", info
- `rose`: `#D4838E` — Noun "die", wrong state, SRS hot
- `peach`: `#D4B483` — XP reward, achievements, Bamboo accent

Each has 3 variants: `base`, `dim` (10% opacity surface), `on` (text on fill).

**Text:**
- `primary`: `#E1E8E4` (Mint Silk)
- `secondary`: `#8A9D97` (~4.8:1 contrast)
- `tertiary`: `#4A5D57` (Slate Moss — hints only)

**Borders:**
- `subtle`: `rgba(225, 232, 228, 0.06)`
- `default`: `rgba(225, 232, 228, 0.10)`
- `strong`: `rgba(225, 232, 228, 0.18)`

### Feature Colors (muted variants)
- `reading`: `#7BC88C` (green)
- `writing`: `#8BB5CF` (teal-blue)
- `listening`: `#D4B483` (bamboo)
- `speaking`: `#D4838E` (muted rose)
- `exam`: `#B8A9D4` (muted lavender)

### Typography
- **Headings**: Quicksand (Bold/SemiBold/Medium)
- **Body**: Nunito (Regular/Medium/SemiBold/Bold/ExtraBold)
- Fonts loaded via `@expo-google-fonts/quicksand` and `@expo-google-fonts/nunito`
- Font family exports: `typography.fontFamily.heading`, `.headingSemibold`, `.body`, `.bodyBold`, `.bodyBlack`, etc.

### Border Radius
- `sm`: 8px, `md`: 12px, `lg`: 16px
- `stone`: 24px (cards and containers)
- `2xl`: 24px (hero cards)
- `pill`: 999px (buttons, badges, nav)

### Shadows
- `zenGlow` — Soft sage glow: `shadowColor: '#8EAD92'`
- `floatShadow` — Floating element shadow: `shadowColor: '#1A2421'`

### Tailwind Config
`deutschmeister-mobile/tailwind.config.js` mirrors token colors for NativeWind usage:
- `bg-background`, `bg-surface`, `bg-surface-elevated`
- `text-zen-text`, `text-zen-muted`
- `rounded-stone` for 24px radius

## Process

1. **Understand the change** — what colors/styles need updating
2. **Update `src/theme/tokens.json`** — master design token source
3. **Update `src/theme/index.ts`** if adding new exports (shadows, radius, etc.)
4. **Update `tailwind.config.js`** if it's used in NativeWind classes
5. **Find all affected files** — search for old color values
6. **Update screens and components** — apply new values, ensure fontFamily is set
7. **Verify contrast** — text must pass WCAG AA (4.5:1 for body, 3:1 for large text)

## Key Rules
- Every `Text` style MUST have a `fontFamily` property from `typography.fontFamily.*`
- Match fontFamily to fontWeight: black→bodyBlack, bold→bodyBold/heading, semibold→bodySemibold
- Cards use `borderRadius: radius.stone` (24px)
- Buttons use `borderRadius: radius.pill` (999px)
- Touch targets must be ≥ 48x48px
- Body text lineHeight: 1.6 (accessibility)
