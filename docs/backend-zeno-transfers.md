# ZENO-to-ZENO transfer backend

## API

`POST /api/security/pin` enrolls a six-digit transaction PIN during account setup. It also updates an existing server PIN when the caller supplies the current PIN. The server stores a salted PBKDF2-SHA-256 hash; the raw PIN is never stored. Five consecutive failures lock PIN verification for 15 minutes.

`POST /api/transfers/zeno` accepts a Clerk bearer token and this body:

```json
{
  "recipientId": "user_...",
  "amount": 25.5,
  "currency": "USD",
  "pin": "123456",
  "idempotencyKey": "client-generated-unique-key"
}
```

The server validates the recipient and amount, verifies the transaction PIN, and calls the restricted `transfer_zeno_wallet` database function. That function builds the debit and credit entries itself and posts them through the immutable ledger writer in one database transaction. The MVP fee is zero. Reusing an idempotency key with the same request returns the original transaction; using it with different request data is rejected.

## Deployment prerequisites

1. Apply `supabase/migrations/20261101090000_zeno_p2p_transfers.sql` to the Supabase project.
2. Configure server-only `PIN_HASH_SECRET` with at least 32 random characters wherever Expo API routes run. Keep it out of `EXPO_PUBLIC_*` variables and the app bundle.
3. Ensure the server has `CLERK_SECRET_KEY` and `SUPABASE_SECRET_KEY`; the mobile app continues to use Clerk session tokens and Supabase's publishable key.

New accounts enroll the transaction PIN from the existing PIN confirmation step. Existing users can enroll/update the server PIN from Profile → Security → PIN after confirming their current local PIN.
