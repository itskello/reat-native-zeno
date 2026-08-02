Read AGENTS.md first and follow it strictly.

Create the ZENO reference/content data system using hardcoded TypeScript data. 
Add `types/content.ts`, `data/countries.ts`, `data/currencies.ts`, 
`data/mobile-money-providers.ts`, and `data/transaction-types.ts`.

Define:
- Supported countries (initially Benin and Côte d'Ivoire) — each with 
  dial code, flag, default currency, and accepted KYC document types.
- Supported currencies — code, symbol, name, and display formatting rules.
- Mobile Money providers per country (e.g. MTN, Moov, Orange) — each with 
  display name, logo asset key, and which country/countries it's available in.
- Transaction types (Sent, Received, Deposit, Withdrawal, Payment Request, 
  Card Payment, Payment Link) — each with a label, icon key, and a color 
  mapped to the ZENO design system (Section 7 of AGENTS.md).

Include a small, realistic sample dataset covering Benin and Côte d'Ivoire 
only for now — no other countries, currencies, or providers yet. Keep it 
simple, strictly typed, and easy to extend when a new country, currency, 
or provider is added later, per AGENTS.md's scalability rules.