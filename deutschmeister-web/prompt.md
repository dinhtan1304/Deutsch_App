# Claude Code Prompt — Deutschmeister Mobile App

## Context

Bạn đang build app học tiếng Đức **Deutschmeister** dùng **React Native + Expo**.
Design system: **Bold Dark + Pastel Soft UI** — nền cực tối `#080810`, accent là các màu pastel nhẹ (mint, lavender, sky, rose, peach), CTA duy nhất là lime `#c9f53b`.

File tokens: `src/theme/tokens.json` (đã có sẵn, đọc trước khi code).

---

## Task

Implement design system và 4 màn hình chính theo đúng file tokens. Đọc `tokens.json` trước, sau đó thực hiện theo thứ tự dưới đây.

---

## Step 1 — Setup theme

Tạo file `src/theme/index.ts`:

```ts
// Đọc tokens.json và export typed constants
// Tất cả màu sắc, spacing, borderRadius, typography phải lấy từ tokens
// Không hardcode bất kỳ giá trị nào ngoài file này
```

Yêu cầu:
- Export `colors`, `spacing`, `radius`, `typography`, `animation`
- Type-safe hoàn toàn (không dùng `any`)
- Thêm helper `pastelSurface(color: PastelKey)` → trả về `{ background, borderColor }` với opacity 10%

---

## Step 2 — Component Library

Tạo các base components trong `src/components/ui/`:

### `PastelCard`
```
Props: color (PastelKey) | 'neutral', children, style?
- background = color.dim (10% opacity)
- border = 1px color.base at 20% opacity
- borderRadius = radius.xl (20)
- padding = spacing.lg (16)
```

### `GenderBadge`
```
Props: gender: 'der' | 'die' | 'das'
- der → sky palette
- die → rose palette  
- das → mint palette
- Style: pill shape, uppercase label "DER — masculin" etc.
```

### `PrimaryButton`
```
Props: label, onPress, loading?
- background = lime #c9f53b
- color = lime.on #0a1400
- borderRadius = pill (999)
- height = 50
- fontWeight = 800
- Chỉ dùng cho 1 action chính duy nhất trên màn hình
```

### `GhostButton`
```
Props: label, onPress
- background = b2, border = border.default
- Dùng cho action phụ (Xem lại, Bỏ qua)
```

### `FloatingNav`
```
Props: activeTab: 'home' | 'learn' | 'rank' | 'profile'
- Floating island pill, margin: 8 12 12
- background = b2, border = border.default
- Active tab: lime fill (home) hoặc lavender tinted (các tab khác)
- 4 items: Home, Học, BXH, Tôi
```

### `QuizOption`
```
Props: label, letter: 'A'|'B'|'C'|'D', state: 'default'|'correct'|'wrong'|'selected'
- state = correct → mint tinted
- state = wrong   → rose tinted
- Letter box: 26x26, borderRadius 8
```

### `SRSChip`
```
Props: word, urgency: 'hot' | 'warm'
- hot  → rose palette (cần ôn khẩn)
- warm → peach palette (cần ôn sớm)
- pill shape
```

---

## Step 3 — Screens

### `HomeScreen`

Layout (ScrollView, padding horizontal 16):

1. **Status + Header** — greeting nhỏ "Guten Morgen", tên lớn bold, avatar lavender
2. **Hero Streak Card** (`heroCard` token)
   - Nền b2, border lime 15% opacity, borderRadius 2xl (28)
   - Streak number 64px weight 800, màu lime
   - Week dots: 7 ô, done = lime 12% opacity, today = lime solid
   - Level pill (lavender) + flag 🇩🇪 góc phải
3. **2-col metric grid**
   - Từ đã học → mint
   - Độ chính xác → peach
4. **CTA Button** "Tiếp tục học →" — PrimaryButton full width
5. **Module grid 2x2** — PastelCard mỗi ô
   - Từ vựng → lavender
   - Giới tính → sky
   - Động từ → mint
   - Phát âm → peach
6. **FloatingNav** active = home

---

### `LessonScreen`

Props: `word: Word` (xem type bên dưới)

Layout:

1. **Nav bar** — back button (b2 surface) + progress bar lime + "9/20" label
2. **Word Hero Card** (borderRadius 2xl, b2 surface)
   - GenderBadge
   - Từ 50px weight 800
   - Phiên âm italic, mờ
   - Nghĩa tiếng Việt
   - Example sentence pill (b3 background)
3. **Conjugation section**
   - Section label uppercase muted
   - Mỗi row: pronoun mờ + form bold + optional tag "hay dùng" (peach)
4. **2 buttons** — GhostButton "Xem lại" (1fr) + PrimaryButton "Tiếp theo →" (2fr)

```ts
type Word = {
  text: string
  phonetic: string
  gender: 'der' | 'die' | 'das'
  meaning: string
  example: string
  conjugations?: { pronoun: string; form: string; highlight?: boolean }[]
}
```

---

### `QuizScreen`

Props: `question: QuizQuestion`

Layout:

1. **Meta row** — quiz type pill (lavender) + hearts (3 hearts, rose dot, empty = b3)
2. **Question card** (b2, borderRadius 2xl)
   - Instruction text nhỏ mờ
   - Từ 44px weight 800
   - Nghĩa nhỏ bên dưới
3. **4 QuizOption** stacked
4. **Feedback bar** (sau khi chọn)
   - Correct → mint: check icon + "Chính xác!" + giải thích
   - Wrong → rose: x icon + đáp án đúng + giải thích
5. **XP badge** (peach) "＋10 XP · Combo x3"
6. **PrimaryButton** "Câu tiếp theo →"

```ts
type QuizQuestion = {
  word: string
  meaning: string
  type: 'gender' | 'conjugation' | 'translation'
  options: { label: string; letter: 'A'|'B'|'C'|'D' }[]
  correctLetter: 'A'|'B'|'C'|'D'
  explanation: string
}
```

---

### `StatsScreen`

Layout:

1. **Header** "Tiến độ" 22px weight 800
2. **Level Hero Card** (lavender tinted, borderRadius 2xl)
   - Level badge square (lavender fill, dark text)
   - Level name + XP progress bar (lavender)
3. **3-col metric grid**
   - Từ học → mint
   - Chính xác → peach
   - Thời gian → sky
4. **Activity Chart Card** (b2, borderRadius 2xl)
   - Label uppercase muted
   - 7 bars, active day = lime, others = b3
   - Day labels nhỏ bên dưới
5. **SRS Card** (b2, borderRadius 2xl)
   - Label "Cần ôn tập · SRS"
   - SRSChip wrapped row

---

## Step 4 — Navigation

Dùng **React Navigation v6** với Bottom Tab Navigator ẩn tabBar mặc định.
Render `<FloatingNav>` thủ công bên trong mỗi screen layout.

```ts
// Tab screens: Home, Learn (Lesson + Quiz stack), Leaderboard, Profile
```

---

## Step 5 — Animations

Áp dụng `react-native-reanimated` cho:

| Element | Animation |
|---|---|
| QuizOption correct/wrong | scale 1 → 1.02 → 1, duration 150ms |
| XP badge | slide up + fade in, spring easing |
| Hero streak number | count-up khi màn hình mount |
| Progress bar | width animate từ 0 đến giá trị, 400ms decelerate |
| FloatingNav active tab | background fade, 250ms |

Dùng `animation.duration` và `animation.easing` từ tokens.

---

## Constraints

- **Không hardcode màu** — mọi giá trị lấy từ `src/theme/index.ts`
- **Không dùng `StyleSheet.create` inline màu** — chỉ reference theme
- **Tất cả text** trên nền tối dùng `colors.text.primary` hoặc `colors.text.secondary`
- **Pastel màu không bao giờ full opacity** trừ khi là fill của badge/button
- **Lime chỉ dùng cho PrimaryButton và streak hero** — không dùng làm text color thông thường
- **FloatingNav** không dùng React Navigation tabBar mặc định
- Mỗi file component không quá 150 lines — tách nhỏ nếu cần

---

## File structure

```
src/
├── theme/
│   ├── tokens.json       ← file đã có
│   └── index.ts          ← export typed theme
├── components/
│   └── ui/
│       ├── PastelCard.tsx
│       ├── GenderBadge.tsx
│       ├── PrimaryButton.tsx
│       ├── GhostButton.tsx
│       ├── FloatingNav.tsx
│       ├── QuizOption.tsx
│       └── SRSChip.tsx
└── navigation/
    └── AppNavigator.tsx
```

---

## Bắt đầu

Đọc `tokens.json` → implement `src/theme/index.ts` → implement components theo thứ tự → implement screens.
Sau mỗi file hỏi tôi confirm trước khi sang file tiếp theo.