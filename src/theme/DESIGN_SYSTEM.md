# ZENO Design System

## 1. Design Tokens

### Colors
- ZENO Blue: `#0057FF` — Primary actions, highlights, CTAs.
- ZENO Green: `#C7FF4A` — Card accent, success states, CTAs.
- ZENO Dark: `#0A1712` — Dark surfaces for Send/Get Paid pages and premium cards.
- Sky: `#EAF6FF` — Light app shell background.
- Background: `#F4FAFF` — Base app background for account, screens, and outer areas.
- Success: `#22C55E` — Success states, verified badges.
- Warning: `#F59E0B` — Pending/status alerts.
- Error: `#EF4444` — Failed transactions.
- Text Primary: `#071706` — Headings and key information.
- Text Secondary: `#6B7280` — Body text and metadata.

### Typography
- Logo font: Zalando Sans Condensed (logo/wordmark only).
- UI font: SF Pro Display/Text.
- Display: `36px`, Bold, `120%` line-height.
- H1: `32px`, Bold, `120%`.
- H2: `24px`, Semibold, `120%`.
- H3: `20px`, Semibold, `120%`.
- Body Large: `16px`, Regular/Medium, `140%`.
- Body Medium: `14px`, Regular/Medium, `140%`.
- Caption: `12px`, Regular, `140%`.

### Spacing Scale
`4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 72, 80` px.

### Radii
- Small: `12px` — cards, buttons.
- Medium: `20px` — dialogs, forms.
- Large: `28px` — hero blocks.
- Pill/Full: `9999px` — pill buttons, Dynamic Island.

### Shadows
- Low: `0 2px 4px rgba(0, 0, 0, 0.08)`.
- Medium: `0 4px 8px rgba(0, 0, 0, 0.1)`.
- High: `0 8px 16px rgba(0, 0, 0, 0.15)`.
- Hero: `0 20px 40px rgba(10, 23, 18, 0.08)`.
- Card: `0 12px 28px rgba(10, 23, 18, 0.08)`.

### Icon Sizes
- Small: `24px`.
- Medium: `32px`.
- Large: `48px`.
- XLarge: `64px`.

## 2. Component Inventory

### DynamicIsland
- Props: `title: string`.
- Visuals: pill shape, `24px` height, dark background `#0A1712`, white bold text.
- Notes: title morphs instantly on feature tap.

### HeroBlock
- Props: `color: string`, `children`.
- Visuals: `28px` rounded corners, strong drop-shadow.
- Examples: blue for Wallet, dark for Send/Get Paid, green for ZENO Card.

### AppShell
- Props: `color: string`.
- Visuals: fills the outer app background behind phone content.

### FloatingCard
- Props: `title`, `content`, `footer`.
- Visuals: white background, `16px` radius, subtle shadow, `16px` padding, `16–20px` gaps.

### PrimaryButton
- Props: `label`, `onPress`.
- Visuals: full-width bold, `16px` min height, blue or green background, pill radius, white text.

### SecondaryButton
- Props: same as `PrimaryButton`.
- Visuals: white or transparent background, colored border, matching text color, pill radius.

### BalanceCard
- Props: `balance`, `currency`.
- Visuals: large white block, soft shadow, large amount in Display font, accent line or icon in ZENO Blue.

### TransactionItem
- Props: `icon`, `title`, `subtitle`, `amount`, `status`.
- Visuals: horizontal card, icon circle, text, right-aligned amount colored by type.

### VirtualCardPreview
- Props: `cardNumber`, `name`, `expiry`.
- Visuals: `32px` corner radius, light green shell background, floating card image, drop shadow.

### EmptyState
- Props: `image`, `message`, `actionButton?`.
- Visuals: centered illustration, gray text, optional primary button.

## 3. Motion & Gesture Guidelines

### Dynamic Island Morph
- Instant title change with a subtle fade and scale-up.
- Duration: `100ms` ease-out.
- On return, reset to `ZENO CARD` immediately.

### Nested Surface Bounce
- Layered swipe animations: app shell shifts slightly, hero block moves fully, floating cards bounce in.
- Use spring-like easing: `cubic-bezier(0.25, 1.5, 0.5, 1)`.
- Duration: `400–600ms` for full transition.

### Parallax Layers
- Swipe-down: dark background fixed, shell moves slightly, hero block follows swipe, floating cards lag by ~50ms.
- Swipe-up: reverse the motion.

### Gestures
- Swipe Down: open a Wallet feature, Dynamic Island updates before transition.
- Swipe Up: collapse any feature and return to Wallet Home.

## 4. Asset Export Specifications

### Logo
- Canvas: vector, `512×512` export.
- Formats: `SVG`, `PNG@2x`.
- Names: `logo.svg`, `logo.png`.

### Hero Mockups
- Canvas: `1170×2532` (iPhone 14).
- Sizes: `1170×2532`, `2340×5064`.
- Format: `PNG`, `WebP`.
- Names: `hero_brand.png`, `hero_brand@2x.png`.

### Wallet UI
- Canvas: `1170×2532`.
- Sizes: `1170×2532`, `2340×5064`.
- Names: `wallet_home.png`, `wallet_home@2x.png`.

### Card UI
- Canvas: `1170×2532`.
- Sizes: `1170×2532`, `2340×5064`.
- Names: `zeno_card.png`, `zeno_card@2x.png`.

### Image Naming
- Lowercase with underscores, descriptive.
- Store under `assets/images/`.

## 5. Implementation Guide

### Fonts
- Place font files in `assets/fonts`.
- Load with Expo Font in `src/app/_layout.tsx`.
- Register font names: `SFProDisplay-Regular`, `SFProDisplay-Semibold`, `SFProDisplay-Bold`, `SFProDisplay-Heavy`, `ZalandoCondensed-Regular`, `ZalandoCondensed-Bold`.

### Tailwind Setup
- `tailwind.config.js` must use `nativewind/preset`.
- Include app paths in `content`.
- Extend `theme` with colors, spacing, radii, shadows, font sizes.

### Global CSS
- Use `@tailwind base`, `@tailwind components`, `@tailwind utilities`.
- Define reusable utilities like `.zeno-hero-block`, `.zeno-primary-button`, `.zeno-floating-card`, `.zeno-empty-state`.

## 6. Checklist

- [x] Design token files: `colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `shadows.ts`, `iconSizes.ts`.
- [x] Tailwind config extended for ZENO tokens.
- [x] Global utilities in `global.css` for core components.
- [x] Font loading configured in `src/app/_layout.tsx`.
- [x] Component inventory and motion guide documented in `src/theme/DESIGN_SYSTEM.md`.
- [ ] Image briefs and asset export naming captured.
