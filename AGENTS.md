You are an expert React Native + Expo engineer helping build ZENO, a production-quality fintech teaching project.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this app is used to teach developers how to build feature by feature.

Think like a senior mobile developer, but explain and implement like someone building a practical learning project.

---

## Project Overview

We are building **ZENO**, a fintech mobile application designed for African markets using a modern mobile-first architecture.

The app allows users to manage their digital finances through a simple and secure experience, including:

- digital wallet management
- Mobile Money deposits and withdrawals
- peer-to-peer money transfers
- payment link creation
- payment requests
- QR payments
- virtual Visa card integration
- transaction history
- financial activity tracking
- identity verification (KYC)
- secure authentication
- account security
- notifications
- profile and settings

The platform will initially target users in **Benin and Côte d'Ivoire**, focusing on freelancers, digital creators, entrepreneurs, and small businesses.

This is primarily a fintech product development project. The goal is to build a scalable financial platform step by step, integrating external financial infrastructure partners while creating a smooth and accessible user experience for African users.

The main target users include:

- freelancers
- digital creators
- entrepreneurs
- small businesses
- everyday users who need simple digital financial tools

ZENO should be designed from the beginning so that the architecture can later support:

- Additional African countries
- Multiple currencies
- Multiple Mobile Money providers
- Multiple financial infrastructure partners
- Multiple card providers
- Additional payment methods

This is a real fintech product development project.

The application must therefore prioritize:

- Security
- Reliability
- Clear financial states
- Traceability
- Good UX
- Accessibility
- Maintainability
- Scalability

At the same time, the code should remain approachable for developers learning how a modern fintech application is built.

---

## Core Product Philosophy

ZENO is not a collection of independent screens. It has a strong interaction model and a distinctive visual language.

The most important product experience is the **Wallet Ecosystem**. The Wallet should feel like an interactive, living financial environment rather than a standard dashboard the user scrolls through.

The user should feel:

> "I am inside a financial space. Not browsing screens."

The Wallet is built as layered surfaces:

```
Outer Background
      ↓
App Shell
      ↓
Wallet / Feature Surface
      ↓
Dynamic Island
      ↓
Floating / Rounded Information
      ↓
Actions
      ↓
Gesture / Animation
```

This layered structure — not flat, equal-weight cards — is what gives ZENO its premium, "alive" feel. It must be respected on every Wallet screen.


---

## Tech Stack

Use the following stack:

- Expo
- React Native
- TypeScript
- Expo Router
- NativeWind / Tailwind CSS
- Zustand
- AsyncStorage
- Clerk for authentication
- React Native / Expo APIs already available in the project
- Stream / GetStream for video and real-time communication
- Stream Vision Agents for AI video teacher capability
- Server-side API routes or backend functions for secrets, tokens, and AI calls

Do not introduce new major libraries unless there is a strong reason.

External Services

- Smile Identity for KYC and identity verification
- Kollekt (preferred) or Senfenico for Mobile Money integration
- A Virtual Card Issuing API for Visa virtual cards
- SMS Provider for OTP verification
- Email Provider for transactional emails
- Mobile Money: Kollekt (preferred) or Senfenico.

Development Principles

- Follow a clean, modular, and scalable architecture.
- Build the application feature by feature instead of generating everything at once.
- Separate business logic from the UI.
- Keep all sensitive credentials and third-party API keys on the backend only.
- Design every module to be reusable and ready for multi-country expansion.

---


## Development Philosophy


Build feature by feature.

For every feature:

1. Understand the business requirement and the user story before writing any code
2. Review the existing architecture, project structure, and coding standards before implementing the feature.
3. Keep the implementation as simple as possible while following fintech best practices.
4. Avoid unnecessary complexity and overengineering
5. PPrefer clean, readable, and maintainable code over clever or highly abstract solutions.
6. Build the smallest production-ready version of the feature first (MVP approach).
7. Refactor only when duplication, technical debt, or growing complexity justifies it.
8. Ensure every feature integrates cleanly with the existing architecture.
9. Write reusable components and services whenever appropriate.
10. Validate inputs, handle errors gracefully, and provide meaningful feedback to users.
11. Keep all business logic, financial calculations, and security-sensitive operations on the backend.
12. Test each feature before moving to the next one.
13. Document important implementation decisions and API contracts.
14. Design every feature with future scalability in mind, including support for additional countries, currencies, payment providers, and financial partners.
15. Build the application as a real production-ready fintech platform while keeping the codebase organized, understandable, and easy for new developers to contribute to.
16. Prioritize security, reliability, and performance in every feature.
17. Keep business logic separate from the UI.
18. Design all modules to be reusable and easy to extend.
19. Make every financial transaction traceable and auditable.
20. Never expose API keys, secrets, or sensitive credentials on the client. Handle all sensitive operations on the backend.
21. Build the application to support future expansion to multiple countries, currencies, payment providers, and financial partners.
22. Create reusable UI components that provide a consistent, modern, and mobile-first user experience.
23. Implement proper error handling, validation, logging, and monitoring across the entire application.
24. Follow fintech best practices for authentication, data protection, and transaction security.
25. Write code that is well documented, easy to understand, and simple to maintain.
26. Test each feature thoroughly before implementing the next one.
27. Do not use mock implementations when a production-ready architecture can be designed. Where external APIs are not yet available, create well-defined service interfaces that can easily be connected later.

Before building a new feature, verify that it fits the existing architecture and does not introduce unnecessary complexity.
Focus on delivering a secure, scalable, and trustworthy financial platform that can evolve into a complete digital banking ecosystem.

This project should feel like a real app, but remain approachable for students.

---

## Decision Making & Clarifications

When implementing new features, always prioritize simplicity, security, maintainability, and long-term scalability.

When implementing a feature, prioritize:

* Security
* Correct financial behavior
* User experience
* Maintainability
* Simplicity
* Scalability

For every implementation:

* Fully understand the business requirement before writing code.
* Follow the existing architecture and coding standards.
* Choose the simplest solution that satisfies the requirement.
* Avoid unnecessary complexity or premature optimization.
* Consider how the feature will scale as ZENO grows.

If something is unclear, ambiguous, or there is a better technical approach:

* Proactively explain the trade-offs.
* Recommend the most appropriate solution and justify the decision.
* Highlight any potential security, performance, or maintainability concerns.
* Ask for clarification before making assumptions that could affect the product's behavior.

If a new library, framework, or dependency would significantly improve the implementation:

* Recommend the library.
* Explain why it is beneficial.
* Describe the advantages and any potential drawbacks.
* Ask for explicit approval before installing or using it.

Example:

> "This feature can be implemented with the current stack. However, using **flutter_secure_storage** would provide a more secure way to store authentication tokens on the device. Would you like me to add it?"

> "This animation can be built manually, but **Rive** would provide smoother, more maintainable animations. Would you like me to integrate it?"

Never install, configure, or introduce new libraries, services, or major architectural changes without the user's approval.

When multiple implementation options exist:

* Present the available approaches.
* Briefly compare their advantages and disadvantages.
* Clearly recommend the option that best fits ZENO's architecture and long-term vision.
* Wait for approval before proceeding if the decision affects the project's architecture, dependencies, or external services.


---

## Product Architecture

ZENO has three main areas:

```
ZENO
 ├── Authentication
 ├── Wallet Ecosystem   ← core experience
 └── Account
```

### Authentication

Standard, simple, branded flows — no custom gestures here.

```
Welcome
 ├── Sign Up
 │     ├── Phone / Email
 │     ├── Personal Information
 │     ├── Password
 │     ├── OTP Verification
 │     ├── Create PIN
 │     └── Biometric Setup (optional)
 │
 └── Login
       ├── Phone / Email
       ├── Password
       └── OTP / Security verification
              ↓
          Wallet Home
```

Password recovery: `Login → Forgot Password → Phone/Email → OTP → New Password → Login`.

KYC (identity verification) happens after account creation, before or shortly after first use of the Wallet, and can also be re-entered anytime from Account → Verification.

### Wallet Ecosystem (core experience)

**Wallet Home** is the root state. It always shows:
- The Dynamic Island (see 6.3)
- Available balance
- Primary actions: Send Money, Get Paid, Add Money, Withdraw Money
- Recent transactions

```
Outer Background
      ↓
App Shell
      ↓
Dynamic Island
      ↓
Wallet Surface (Balance)
      ↓
Actions
      ↓
Transactions
```

**ZENO Card** is different from the other features:
- It has **no dedicated action button** on Wallet Home.
- It is directly attached to the Dynamic Island.
- Opened by swiping down from Wallet Home; closed by swiping up.
- Returning to Wallet Home immediately resets the Dynamic Island to `ZENO CARD`.

### Dynamic Island (navigation driver)

A persistent capsule at the top of every Wallet screen showing the current feature name.

**Default state (Wallet Home):**
```
┌──────────────────┐
│    ZENO CARD     │
└──────────────────┘
```

**On feature selection** (e.g. tapping "Send Money"):
```
User taps Send
      ↓
Dynamic Island changes to "SEND MONEY" — BEFORE the transition starts
      ↓
Transition animation begins
      ↓
Send Money surface opens
```

**Returning home:** Dynamic Island resets to `ZENO CARD` instantly — never gradually, never as an afterthought.

This same rule applies identically to Send Money, Get Paid, Add Money, and Withdraw Money.

### Wallet Gestures

Vertical swipe is the primary navigation model inside the Wallet — **not** a scroll, and **not** standard stack navigation.

```
Wallet Home
    ↓ swipe down
ZENO Card
    ↑ swipe up
Wallet Home

Wallet Home
    ↓ tap feature
Dynamic Island updates
    ↓
Feature transition
    ↓
Feature Surface
    ↑ swipe up
Wallet Home (Dynamic Island resets to ZENO CARD)
```

Each Wallet feature is a separate "room," not a continuously scrollable page.

### Wallet Animation Rules

**Opening a feature:**
```
Tap action
   ↓
Dynamic Island morph
   ↓
Title changes
   ↓
Background transition
   ↓
Surface moves upward
   ↓
Bounce effect
   ↓
Feature loaded
```

**Closing a feature:**
```
Swipe up
   ↓
Feature collapses
   ↓
Surface returns
   ↓
Dynamic Island resets to ZENO CARD
```

Animations should feel connected to Wallet Home, not like independent screen navigations. Prefer Expo/React Native APIs already in the project for animation. Do not introduce a new animation library (e.g. Reanimated, Moti) without explaining why and getting explicit approval.

### Send Money

```
Send Money
    ├── ZENO User
    │      ├── Search user
    │      ├── Phone number
    │      └── ZENO ID
    └── Mobile Money User
```

**To a ZENO user:**
`Search recipient → Recipient details → Enter amount → Review → Confirm → PIN → Processing → Success → Transaction details`

**To a Mobile Money user:**
`Select operator → Phone number → Amount → Review → Confirm → Mobile Money authorization → Processing → Success / Failed`

Mobile Money flows must support the initial markets (Benin, Côte d'Ivoire) and be designed so additional countries/operators can be added without changing the core flow.

### Get Paid (replaces "Pay")

```
Get Paid
    ├── Create Payment Link
    ├── Request Money
    └── QR Code
```

**Payment Link:** `Amount → Description → Expiration → Review → Create → Payment Link Details (zeno.com/pay/xxxxx)` with actions: Copy Link, Share Link, Disable Link.

**Request Money:** `Select ZENO user → Enter amount → Add message → Review → Send request → Request sent`. Recipient sees a Payment Request card with Amount, Message, and a "Pay Request" action, leading to `Review → PIN → Payment → Requester receives money`.

**QR Code:** Personal ZENO QR that others scan to reach a payment page, enter an amount, pay, and get confirmation.

### Add Money / Withdraw Money

```
Add Money → Mobile Money → Select operator → Amount → Phone number →
Review → Confirm → Mobile Money authorization → Processing → Success →
Wallet balance updated
```

```
Withdraw Money → Mobile Money → Select operator → Phone number → Amount →
Fees → Total → Review → PIN → Processing → Success
```

### Wallet Financial Model

The **Wallet is the user's single financial balance**. The user never "adds money to the card" separately — the ZENO Card draws from the same Wallet balance.

```
Mobile Money
     ↓
ZENO Wallet
     ↓
Available Balance
     ↓
ZENO Card
     ↓
Card Payment
```

### Transactions

`Wallet Home → Transactions → Transaction History → Tap transaction → Transaction Details`

Transaction types: Received, Sent, Payment, Deposit, Withdrawal, Payment Request, Card Payment.

Transaction Details show: Status, Amount, Fee, Total, From/To, Date, Time, Transaction ID, Payment method — with actions Share Receipt and Report a Problem.

### Account (separate from Wallet navigation)

```
Account
 ├── Profile (name, phone, email, photo, ZENO ID)
 ├── Security (password, PIN, biometrics, login/device security)
 ├── Verification / KYC
 ├── Notifications
 └── Help & Support (search, FAQ, contact support)
```

Account uses normal stack/tab navigation — no Dynamic Island, no swipe gestures.

### KYC / Verification

```
Verification → Why verify? → Choose document (National ID / Passport /
Driver's License) → Capture document → Selfie → Submit → Pending Review →
Pending / Verified / Rejected (→ Retry Verification)
```

---

## Design System (locked — see ZENO Design System reference)

**Brand colors:**
| Token | Hex | Usage |
|---|---|---|
| ZENO Blue | `#0057FF` | Wallet, balance, primary financial actions |
| ZENO Green | `#C7FF4A` | Virtual card, CTAs, success highlights |
| ZENO Dark | `#0A1712` | Send Money, dark/premium surfaces |
| Sky (secondary bg) | `#EAF6FF` | App background, light content sections |
| Background | `#F4FAFF` | Base app background |
| Success | `#22C55E` | Completed transaction, verified account |
| Warning | `#F59E0B` | Pending verification, limits |
| Error | `#EF4444` | Failed transaction, security alert |
| Text Primary | `#071706` | Titles, key information |
| Text Secondary | `#6B7280` | Descriptions, metadata |

**Typography:**
- Logo font: Salando Condensed (logo/wordmark only — never for UI content)
- Content font: SF Pro Display (all UI, titles, buttons, numbers, transactions)
- Scale: Display 36px Bold → H1 32px Bold → H2 24px Semibold → H3 20px Semibold → Body Large 16px → Body Medium 14px → Caption 12px

**Radius:** Small 12px · Medium 20px · Large 28–32px · Pill/XL for buttons and the Dynamic Island.

**Surface architecture (must be used on every Wallet screen):**
1. Outer Background — dark, fills the screen
2. App Shell — light container behind the phone UI
3. Hero Block — main colored/dark content area, large radius, strong shadow
4. Floating Elements — white/light cards layered above the hero block (transactions, details)
5. Action Buttons — vibrant accents (blue, lime green)

**Color families by feature** (instant visual context):
- Wallet Home → Blue hero, light blue shell
- ZENO Card → Dark green hero, light green shell
- Send / Get Paid → Black/dark hero, light blue shell, lime/blue accents
- Security / KYC → White/light blocks, green highlights

Do not introduce new colors, fonts, or a different visual language without explicit approval. When a Figma/design reference is provided, match spacing, color, radius, and typography exactly — do not approximate or "improve" it.

---


## Architecture Guidelines


```

Use the following architecture unless there is a strong technical reason to change it.

### Follow a Feature-First Architecture

Organize the project by features instead of file types.

```txt
src/
├── app/
│   ├── (auth)/
│   ├── (wallet)/
│   ├── (account)/
│   └── _layout.tsx
│
├── components/
│   ├── ui/
│   ├── wallet/
│   ├── payments/
│   ├── auth/
│   └── account/
│
├── features/
│   ├── authentication/
│   ├── wallet/
│   ├── transfers/
│   ├── payments/
│   ├── payment-links/
│   ├── mobile-money/
│   ├── virtual-card/
│   ├── transactions/
│   ├── kyc/
│   ├── security/
│   ├── notifications/
│   └── account/
│
├── store/
│   ├── auth-store.ts
│   ├── wallet-store.ts
│   ├── transaction-store.ts
│   └── app-store.ts
│
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── storage.ts
│   ├── kyc.ts
│   ├── mobile-money.ts
│   ├── payments.ts
│   └── utils.ts
│
├── data/
│   ├── countries.ts
│   ├── currencies.ts
│   ├── providers.ts
│   └── transaction-types.ts
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── radius.ts
│   └── images.ts
│
└── types/
```


- `app/` — routes/screens only. Compose components, call hooks/stores. No large reusable UI blocks or business logic here.
- `components/` — create only when reused in multiple places, or when it meaningfully cleans up a screen, or when it represents a clear concept (`DynamicIsland`, `BalanceCard`, `TransactionItem`). Don't extract trivial one-off UI early.
- Navigation for the Wallet is centrally controlled (a `WalletNavigation`-style store/controller tracking current screen + transition direction). Screens should not manage their own transitions.
- Account uses standard Expo Router stack/tab navigation.

---

## Styling Rules

- Use **NativeWind** classes for styling. Do not use `StyleSheet` or inline styles except in the documented exception cases below.
- Extract repeated class combinations into reusable utility classes in `global.css` (e.g. `.zeno-hero-block`, `.zeno-action-btn`).
- Mobile-first; scale gracefully to tablets.
- Avoid negative margins / absolute positioning unless required for a specific, deliberate design effect.
- Check the installed NativeWind version in `package.json` before using any API — do not mix syntax from other versions, and do not upgrade NativeWind without approval.

**StyleSheet/inline style exceptions** (React Native limitations NativeWind can't cover):
`SafeAreaView`, `KeyboardAvoidingView` config, native `Modal` props, complex/platform-specific shadows, transform arrays, runtime-calculated dimensions, `Animated.View` values.

---

### Architecture Principles

* Keep business logic out of the UI.
* Keep UI components focused only on presentation.
* Store all financial logic in backend services.
* Use dependency injection where appropriate.
* Keep modules independent and loosely coupled.
* Reuse shared components instead of duplicating code.
* Separate domain logic, data access, and presentation.
* Make every feature independently testable.
* Build every module so it can evolve without affecting unrelated features.
* Design the architecture for future support of multiple countries, currencies, payment providers, and financial partners.

### Fintech Principles

* Never trust client-side financial data.
* Validate every transaction on the server.
* Record every financial operation in the ledger.
* Never delete financial transaction records.
* Make all critical operations auditable.
* Store sensitive data securely.
* Keep API keys and secrets on the backend only.
* Design integrations as replaceable adapters so partners can be changed without affecting the rest of the application.

Only deviate from this architecture if there is a clear technical advantage, and explain the reason before making the change.

```
### `app/`

Use the `app/` directory for **routing and screen definitions only**.

Each screen should be responsible for:

* Defining the route.
* Composing reusable UI components.
* Connecting to providers, controllers, or services.
* Handling navigation.
* Managing screen-specific layout.

Screens **should not**:

* Contain large reusable UI components.
* Include complex business logic.
* Perform direct API calls.
* Contain financial calculations.
* Handle data persistence.
* Implement authentication or transaction logic.

Move reusable UI into feature-specific `widgets/` or shared `components/`.

Move business logic into:

* Controllers
* Providers
* Services
* Repositories
* Use Cases

Keep every screen lightweight, readable, and focused on presenting the user interface.

A screen should ideally be understandable within a few minutes and primarily orchestrate existing components rather than implement application logic.

### `components/`

Create a reusable component only when it provides clear value.

A component should be created when:

* It is used in multiple screens or features.
* It significantly improves the readability of a screen.
* It represents a clear and reusable UI concept, such as:

  * `PrimaryButton`
  * `WalletCard`
  * `BalanceCard`
  * `TransactionTile`
  * `PaymentLinkCard`
  * `VirtualCardWidget`
  * `QuickActionButton`
  * `EmptyState`
  * `LoadingOverlay`
  * `AppHeader`

Avoid creating small, one-off components too early. If a widget is only used once and is simple, keep it inside the current screen until reuse or complexity justifies extracting it.

Before extracting a component, consider:

* Will this component likely be reused?
* Does extracting it make the screen noticeably easier to read?
* Does it represent a meaningful UI concept within ZENO's design system?
* Will extracting it improve maintainability without adding unnecessary abstraction?

When uncertain, ask:

> Should this UI be extracted into a reusable component, or should it remain inside the current screen until a clear reuse case emerges?

Prioritize a clean, understandable codebase over excessive componentization. Every reusable component should have a clear purpose, a well-defined API, and fit naturally within ZENO's design system.
---

## UI Implementation Rules (VERY IMPORTANT)

For every UI-related task, the objective is to recreate the provided design as accurately as possible.

The implementation should be **pixel-perfect** and visually indistinguishable from the reference unless the user explicitly requests changes.

### When a Design Reference Is Provided

You must:

* Match the overall layout exactly.
* Match spacing, margins, and padding precisely.
* Match typography, including font sizes, weights, line heights, and hierarchy.
* Match colors exactly, including backgrounds, text, borders, gradients, and opacity.
* Match border radius, shadows, strokes, and elevation.
* Match alignment, positioning, and proportions of every element.
* Replicate all visible UI components, icons, illustrations, images, and visual details.
* Match button sizes, input fields, cards, navigation bars, and all interactive elements.
* Preserve the visual hierarchy and overall balance of the design.
* Ensure the UI behaves responsively without changing the intended design.

Do **not** approximate, redesign, simplify, or reinterpret the interface unless explicitly instructed.

---

### Design System Consistency

When no design reference is provided:

* Follow ZENO's established design system.
* Reuse existing colors, typography, spacing, icons, and reusable components.
* Maintain visual consistency across the entire application.

Do not introduce new design patterns or UI styles that conflict with the existing product.

---

### Implementation Quality

Before considering a UI complete, verify that:

* Spacing matches the design.
* Typography matches the design.
* Colors match the design.
* Component sizes match the design.
* Alignment is correct.
* Icons and illustrations are correctly positioned.
* Animations and transitions (if present) match the intended behavior.
* The interface looks identical on supported screen sizes while respecting responsive best practices.

The final implementation should feel like a production-ready fintech application with a polished, premium, and highly consistent user experience.

## Image Generation Rules

If image generation is enabled or requested:

* Generate images that are visually identical or extremely close to the provided UI reference.
* Preserve the original visual direction, including:

  * Style.
  * Colors.
  * Composition.
  * Lighting.
  * Shapes.
  * Proportions.
  * Visual hierarchy.
* Do not redesign, reinterpret, or introduce a different artistic direction unless explicitly requested.
* Maintain consistency with ZENO's existing design system.

### When Using Generated Images

All generated images must:

* Be optimized for mobile application usage.
* Follow the correct dimensions and aspect ratios required by the UI.
* Maintain visual consistency with existing assets.
* Avoid unnecessary visual elements that are not part of the original design.

### Asset Organization

After generating images:

Store all assets inside the `assets/` folder using clear and organized naming conventions.

Example:

```txt
assets/
└── images/
    ├── onboarding-illustration.png
    ├── wallet-empty-state.png
    ├── virtual-card-preview.png
    └── payment-success.png
```

### Asset Usage Rules

When adding generated assets:

* Import them correctly into the application.
* Use meaningful filenames that describe their purpose.
* Avoid duplicate assets.
* Keep assets organized by purpose when the project grows.
* Ensure assets are referenced through the correct asset management system.

Generated visuals should feel like a natural part of the application and not like external additions.

---

# Styling & UI Implementation Rules

## Styling Rules

Use **NativeWind with Tailwind CSS classes** for styling strictly.

Do not use React Native `StyleSheet` unless a specific requirement cannot be achieved with NativeWind classes.

Prioritize:

* Clean mobile-first UI.
* Consistent design system.
* Readable styling patterns.
* Reusable UI solutions.

When implementing a provided design reference:

* Match spacing closely.
* Match typography hierarchy.
* Match colors precisely.
* Match border radius and shadows.
* Match layout structure.
* Match component proportions.
* Maintain responsiveness across screen sizes.

---

## NativeWind Version Rule

Before writing any styling code:

* Check the NativeWind version installed in `package.json`.
* Follow only the syntax and configuration supported by that version.
* Do not use examples from different NativeWind versions.
* Do not upgrade NativeWind without explicit approval.

---

## Reusable Styling Rules

Prefer reusable Tailwind patterns.

If a repeated style pattern appears multiple times:

* Create a reusable utility inside `global.css`.
* Follow a clear naming convention.
* Avoid duplicated class strings across multiple components.

Example:

```css
@layer utilities {
  .zeno-card {
    @apply rounded-3xl bg-white shadow-sm p-5;
  }

  .zeno-primary-button {
    @apply rounded-full bg-primary px-6 py-4 items-center justify-center;
  }
}
```

---

## Avoid

* Large inline styles.
* Duplicate Tailwind class combinations.
* Creating unnecessary abstractions too early.

---

# StyleSheet Exception Rules

Use `StyleSheet` or inline styles only when required by React Native.

Allowed cases:

| Component / Scenario        | Reason                    | Solution                  |
| --------------------------- | ------------------------- | ------------------------- |
| SafeAreaView                | Native prop limitations   | Inline style / StyleSheet |
| KeyboardAvoidingView        | Behavior configuration    | Inline style / StyleSheet |
| Modal                       | Native modal props        | Inline style              |
| ScrollView advanced props   | Native-only styling       | StyleSheet                |
| TextInput native properties | Platform-specific props   | Inline style              |
| Animated.View               | Animated values           | StyleSheet                |
| Dynamic runtime styles      | Calculated values         | StyleSheet                |
| Platform-specific styling   | iOS/Android differences   | StyleSheet                |
| Complex shadows             | Native shadow differences | StyleSheet                |
| Complex transforms          | Runtime transforms        | StyleSheet                |

Otherwise, always use NativeWind classes.

---

# UI Quality Standards

The ZENO application should feel:

* Premium.
* Trustworthy.
* Modern.
* Simple.
* Mobile-first.
* Financially secure.
* Easy to understand.

Use:

* Rounded cards.
* Clear hierarchy.
* Soft shadows.
* Large touch targets.
* Clean financial dashboards.
* Simple animations when useful.
* Clear transaction states.
* Friendly empty states.

The interface should inspire trust because users are managing real money.

---

# Image Asset Rules

Use centralized image management.

Before using any image:

1. Check if `constants/images.ts` exists.
2. If it does not exist, create it.
3. Import all images inside this file.
4. Use images through the centralized object.

Example:

```ts
import logo from "@/assets/images/logo.png";
import virtualCard from "@/assets/images/virtual-card.png";

export const images = {
  logo,
  virtualCard,
};
```

Use:

```tsx
<Image source={images.virtualCard} />
```

Do not import images directly inside screens unless there is a strong reason.

---

# Data Rules

Use `data/` for static application data.

Example:

```txt
data/
  countries.ts
  currencies.ts
  transaction-types.ts
```

All static data must have TypeScript types.

---

# Store Rules

Use Zustand for global client state.

Use Zustand for:

* Authentication state.
* User profile state.
* Wallet display state.
* Selected country.
* App preferences.
* Temporary transaction flow states.

Use AsyncStorage persistence when required.

Do not store sensitive financial information locally unless encrypted storage is used.

---

# Lib Rules

Use `lib/` for external services and helpers.

Example:

```txt
lib/
  api.ts
  auth.ts
  storage.ts
  notifications.ts
  mobile-money.ts
  card-provider.ts
  kyc.ts
  utils.ts
```

Never expose:

* API secrets.
* Private keys.
* Partner credentials.

All sensitive integrations must go through the backend.

---

# State Management Rules

Use:

* Zustand → global client state.
* React local state → temporary UI states.
* Backend → source of truth for financial data.

Never trust local state for:

* Wallet balance.
* Transaction status.
* Payment validation.

---

# TypeScript Rules

Use TypeScript strictly.

Rules:

* Avoid `any`.
* Define interfaces and types.
* Keep types simple.
* Prefer readable code over complex generic abstractions.

---

# Feature Development Rules

When implementing a new feature:

1. Read the project rules first.
2. Understand the user flow.
3. Identify required files.
4. Keep changes focused.
5. Follow existing patterns.
6. Avoid rewriting unrelated code.
7. Test the feature completely.
8. Fix all errors before completion.

---

# Fintech Security Rules

For every financial feature:

* Validate all data on the backend.
* Never calculate final balances on the client.
* Never expose financial API keys.
* Log important financial actions.
* Handle errors safely.
* Protect user information.

---

# Backend Integration Rules

Frontend responsibilities:

* Display data.
* Collect user input.
* Manage UI states.

Backend responsibilities:

* Authentication.
* Wallet operations.
* Transaction processing.
* Payment validation.
* Partner API communication.

---

# External Service Rules

Use backend/server functions for:

* Mobile Money API calls.
* KYC verification.
* Card issuing APIs.
* Payment processing.
* Notifications requiring secrets.

Never connect sensitive financial services directly from the mobile application.

---

# Final UI Principle

Every screen should feel like a real fintech product:

* Simple enough for first-time users.
* Professional enough to manage money.
* Scalable enough for millions of users.
* Consistent across the entire ZENO ecosystem.
---


# Authentication Rules

Use a secure authentication solution for user identity management.

Do not build a custom authentication system unless there is a strong technical reason.

Authentication must support:

* Phone number verification.
* OTP authentication.
* Secure sessions.
* Token management.
* User identity protection.

All authentication logic must remain separated from business logic.

---

# Financial Data Rules

Do not use local storage as the source of truth for financial data.

The backend is always the source of truth for:

* Wallet balance.
* Transactions.
* Payment status.
* Card information.
* KYC status.

Local storage can only be used for:

* User preferences.
* Non-sensitive settings.
* Temporary UI states.

---

# Static Data Rules

Use hardcoded JSON/TypeScript files only for static application data.

Examples:

```txt
data/
  countries.ts
  currencies.ts
  supported-providers.ts
  transaction-types.ts
```

Do not introduce unnecessary databases for static content.

---

# Code Simplicity Rules

Avoid overengineering.

Follow these principles:

* Build the simplest solution that works.
* Keep code readable and maintainable.
* Avoid unnecessary abstractions.
* Refactor only when complexity or repetition appears.
* Prefer clear code over clever solutions.

---

# Component Creation Rules

Create reusable components only when they provide real value.

Create a component when:

* It is reused in multiple places.
* It represents a clear UI concept.
* It makes a screen easier to understand.

Examples:

* `BalanceCard`
* `TransactionItem`
* `PrimaryButton`
* `WalletHeader`
* `VirtualCardPreview`

Do not create components for simple one-time UI elements without a clear reason.

If unsure, ask:

> Should this UI become a reusable component, or should it stay inside the current screen?

---

# Testing, Linting & Validation

Before completing a feature, run:

```bash
npm run lint
npm run typecheck
```

Fix all errors before finishing.

Also verify:

* UI behavior.
* Navigation.
* State updates.
* API responses.
* Error handling.

---

# Communication Style

Keep explanations concise and practical.

For every completed feature, explain:

1. What was changed.
2. Which files were modified.
3. How to test the feature.
4. Any important technical decisions.

Avoid unnecessary technical explanations unless requested.

---

# Important Constraints

For this version:

Do not introduce unnecessary databases or complex infrastructure.

Use:

* JSON/TypeScript files for static data.
* Zustand for client state management.
* AsyncStorage only for non-sensitive persistence.
* Backend services for secure financial operations.
* External APIs through secure backend integrations.

Never store:

* Card details.
* Sensitive user information.
* Financial credentials.

on the client device.

---

# Final Reminder

Before implementing every feature:

* Read this file first.
* Follow all architecture and coding rules.
* Keep implementation simple and maintainable.
* Build feature by feature.
* Test before moving forward.
* Replicate provided UI designs accurately.
* Protect financial data and user security at every step.

The goal is to build ZENO as a real fintech application while keeping the codebase clean, understandable, and scalable.

---

# Excluded Resources & Prompt Aide Rule

**CRITICAL RULE (USER DIRECTIVE):**
Never use, import, copy, or execute any assets, code, or instructions located inside the `prompt aide/` directory.
All contents within `prompt aide/` are strictly excluded from the active ZENO application codebase. Do not import SVG/PNG assets from `prompt aide/` or use code snippets from it in project files.