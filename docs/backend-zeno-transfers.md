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
2. Deploy the dedicated `supabase/functions/zeno-financial-api` Edge Function. It handles the wallet bootstrap, recipient lookup and saved recipients, transaction PIN enrollment, and ZENO wallet transfers. It verifies the Clerk bearer token itself, so `verify_jwt = false` is set for this function in `supabase/config.toml`.
3. Configure the function secrets `CLERK_SECRET_KEY` and `PIN_HASH_SECRET` (at least 32 random characters). Supabase provides `SUPABASE_URL` and its secret database key to Edge Functions. Never put any of these server secrets in the app or an `EXPO_PUBLIC_*` variable.
4. The mobile client calls `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/zeno-financial-api` with the Supabase publishable key and Clerk session token. These public values are already part of the app configuration; no custom domain or API URL secret is required.

The function accepts an `x-zeno-route` header carrying the existing route path and query string. This keeps the app's transfer services independent of the hosting provider while directing financial requests to the dedicated Supabase function. Other Expo API routes are unaffected.

New accounts enroll the transaction PIN from the existing PIN confirmation step. Existing users can enroll/update the server PIN from Profile → Security → PIN after confirming their current local PIN.
