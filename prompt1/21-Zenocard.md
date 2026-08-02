Read AGENTS.md first and follow it strictly.

⚠️ Architecture update to AGENTS.md's Wallet Financial Model: the ZENO Card 
now has its OWN separate balance, distinct from the main Wallet balance — 
not a pass-through. This overrides the original model description ("the 
ZENO Card draws from the same Wallet balance") — update AGENTS.md to reflect 
this once implemented.

New model:
Mobile Money → ZENO Wallet (main balance) → [Top Up] → ZENO Card (own balance) 
→ Card Payment

The user must explicitly top up the Card from the Wallet balance before 
spending on the Card — there is no automatic draw-through. This makes the 
Card behave like a prepaid card the user tops up on purpose, giving clearer 
spending control.

Implement the "ZENO Card" surface exactly as shown in the attached design. 
This surface is the second island — it is drawn by the Dynamic Island morph 
system (DynamicIsland.tsx / ZenoCardSurface.tsx), not routed as a normal 
WalletSurface room.

Layout (top to bottom): "ZENO" (lime green) + "Card" (white) wordmark header 
with a close "✕" button aligned to the right, "Card Balance" label, large 
balance amount ("$0.25" style — dollar sign smaller, amount large, both 
white), the two-card stack illustration (a lime-green ZENO card layered 
behind, a lighter/pale mint ZENO card in front showing Mastercard logo, 
masked card number "5200 828 ****** ", ZENO wordmark, chip + contactless 
icon), card expiry + masked last 4 digits ("12/2031  •••• 5678"), three 
circular action buttons in a row (Top Up — lime green filled circle with a 
"+" wallet icon; View Card — dark green circle with an eye icon; More — 
dark green circle with a "•••" icon), each with a label beneath, and below 
that a white rounded "Transactions" panel with a "See all" link and a list 
of transaction rows (icon, merchant name, date/time, amount, status).

Animation contract (must be respected — see AGENTS.md Wallet Animation Rules 
and the shared island morph system already used for HOME ↔ CARD):
- This entire layout is authored at full-screen size — never build or scale 
  a separate "compact" version of this content.
- The content is anchored top-left; the island scales this surface up from 
  its own top-left corner with no compensating translation.
- Only the top ~80px of content (the "ZENO Card" wordmark header) needs to 
  stay legible throughout the whole morph. Everything below is naturally 
  revealed/clipped by the existing scale + clip mechanism — do not add 
  manual show/hide logic for this.

Data model:
- Add a `cardBalance` field to the card's state (new `card-store.ts`, 
  separate from `wallet-store.ts`), following the same placeholder pattern 
  already used in `wallet-store.ts` (hardcoded placeholder value now, 
  `loadCardBalance()` with a TODO for the real backend fetch later).
- "Top Up" opens a Top Up flow: user enters an amount, confirms, the amount 
  is deducted from the Wallet balance and added to the Card balance (this 
  is a client-side placeholder for now — the real transfer must be validated 
  and recorded server-side once the backend exists, per AGENTS.md fintech 
  rules: never trust client-side balance math for real money movement).
- The Wallet balance shown on Wallet Home and the Card balance shown here 
  are now two distinct numbers — do not conflate them.

Behavior:
- Swipe down from Wallet Home opens this surface (existing cardDragY gesture 
  — no change needed there).
- Swipe up, or tapping the "✕" close button, closes it and returns to 
  Wallet Home.
- "Top Up" opens the Top Up amount-entry flow described above.
- "View Card" reveals full card details (number, CVV) — this should require 
  biometric/PIN confirmation per AGENTS.md fintech security rules; flag 
  before implementing if this needs a new secure-reveal flow not yet built.
- "More" opens a menu/sheet with additional card actions (freeze card, card 
  settings, etc.) — if undefined, implement a minimal placeholder sheet and 
  flag for a follow-up design.
- Transaction list here reuses the existing `TransactionItem` component, 
  filtered to card-only transactions from a new card transaction store (or 
  flag if card transactions should stay merged with the main transaction 
  feed for now, given the backend doesn't exist yet).

@prompt_material/A 1.1 Zeno card.png