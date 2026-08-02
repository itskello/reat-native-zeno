Read AGENTS.md first and follow it strictly.

Implement the Wallet Home screen UI exactly as shown in the attached design 
(@prompt_material/A 1.1 Wallet Dashboard (1).png), matching spacing, layout structure, 
colors, radius, and typography precisely per Section 7 (Design System) 
of AGENTS.md.

The screen must include, top to bottom:
- The Dynamic Island at the top, in its default state showing "ZENO CARD"
  (per Section 6.3 — this is the persistent capsule, not a page title).
- A greeting block showing the logged-in user's first name and avatar 
  from Clerk ("Hey {firstName}", "Welcome Back"), plus a notification 
  bell icon (static UI for now, no notification logic yet).
- The Wallet hero block (ZENO Blue, per the color family for Wallet Home): 
  "Wallet" / "Available Balance" label, the balance amount with a 
  show/hide eye toggle, and the three primary actions — Withdraw Money, 
  Send Money, and Get Paid By Link Or User (lime/green pill, per design) 
  — wired to navigate to their respective Wallet features (stubs are fine 
  if those screens don't exist yet).
- A Transactions section below the hero block ("Transactions" / "See all"), 
  listing recent transactions using the transaction types and colors 
  defined in `data/transaction-types.ts`.

Data sourcing:
- User identity (name, avatar) comes from Clerk.
- Selected country/currency comes from Zustand + AsyncStorage (per the 
  app-store / selected country pattern in AGENTS.md).
- Wallet balance and transaction list should come from the wallet/transaction 
  store (Zustand) for now, backed by placeholder data — do NOT hardcode 
  fake balances directly in the screen. Remember the backend is the source 
  of truth for real balance data later (Section on Financial Data Rules); 
  this screen just needs a clean, typed placeholder shape to build against.

Use assets from the `assets/` folder via the centralized `constants/images.ts` 
import. If a required image (e.g. user avatar placeholder) is missing, use 
a suitable placeholder from Unsplash or Picsum, but note clearly in your 
response which images are placeholders so they can be swapped later.

Respect the Wallet surface architecture (Outer Background → App Shell → 
Dynamic Island → Wallet Surface → Actions → Transactions) — do not flatten 
this into equal-weight stacked cards.