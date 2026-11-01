# ZENO backend MVP

## Source of truth

Supabase PostgreSQL stores wallet accounts and the immutable double-entry ledger. Clerk remains the identity provider. The app reads only rows allowed by Clerk-backed Supabase RLS. Financial writes happen in trusted server functions and PostgreSQL transactions; the app never sends a balance or ledger posting directly.

The first migration is `supabase/migrations/20261031230000_financial_ledger.sql` and has been applied to the Supabase project created for ZENO. The project is currently on its `main` production branch; use synthetic data only until a separate development environment is established.

## Amount representation

Ledger amounts are signed by entry side and stored as positive integer minor units. USD and EUR use cents; XOF uses whole francs. Do not use floating-point values for ledger amounts or exchange-rate calculations.

## First backend milestones

1. Create a Supabase development project and connect the existing Clerk instance as a third-party auth provider. Use the current third-party integration in both dashboards; do not create a Clerk JWT template or share Supabase's JWT secret.
2. Apply the initial ledger migration.
3. Add a trusted wallet-provisioning endpoint and authenticated read contracts for wallet balances and activity.
4. Replace the demo wallet and transaction stores with server-backed reads.
5. Add idempotent transfer posting, then connect provider-backed deposits and withdrawals when partner credentials and callback contracts are available.

Official setup references:

- [Supabase: Clerk third-party auth](https://supabase.com/docs/guides/auth/third-party/clerk)
- [Clerk: Connect with Supabase](https://clerk.com/docs/guides/development/integrations/databases/supabase)

The mobile Supabase client factory is `src/lib/supabase.ts`; it receives the current Clerk `getToken` callback. Read-only wallet queries are in `src/features/wallet/wallet-read-service.ts`. The authenticated `POST /api/wallet/bootstrap` route provisions a user's three empty currency accounts using the server-only `SUPABASE_SECRET_KEY`. It is safe to retry. In the app, `EXPO_PUBLIC_FINANCIAL_SANDBOX=false` switches the Wallet and transaction history to these authenticated Supabase reads; a missing flag defaults to demo mode in development and backend mode in production. This switch does not create or post money.

## Development card simulation

With `EXPO_PUBLIC_FINANCIAL_SANDBOX=true`, the wallet starts with a local demo balance of 100 USD and the virtual card starts at 0 USD. Card top-ups debit that same wallet state; transfers back from the card credit it. Confirmed movements appear in local transaction history and notifications with the resulting wallet and card balances. This sandbox is in-memory, resets when the app process restarts, and never posts to the Supabase ledger or moves real money. The support assistant has no account lookup tool and must not claim it verified this demo balance or a payment.

## Security boundaries

- `EXPO_PUBLIC_*` values may contain only the Supabase project URL and publishable key. They are not secrets.
- Never add a Supabase secret/service-role key to the app, `.env.example`, or a committed file.
- The mobile JWT is used only for user-scoped reads protected by RLS.
- Ledger tables grant clients read-only access. `provision_wallet_accounts` and `post_ledger_transaction` are executable only by `service_role` trusted server code.
- Posted entries are append-only. Corrections must be represented by a new compensating transaction.
- Every posting is balanced per currency and keyed by an idempotency key. Wallet debits cannot take a balance below zero.

## Current limitation

The Supabase wallet reads are now wired into the app when sandbox mode is disabled. The ledger still has no client-triggered posting API or provider-backed deposit, withdrawal, transfer, or card transaction. No real financial action should be represented as successful until the corresponding trusted backend operation and provider integration are implemented.
