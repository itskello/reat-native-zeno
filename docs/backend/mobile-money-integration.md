# Mobile Money backend

## Current boundary

The app calls `POST /api/deposits/mobile-money` and `POST /api/withdrawals`.
The PayDunya sandbox collection now uses the hosted invoice flow from the
Supabase `zeno-financial-api` function. It is limited to XOF deposits for
MTN/Moov Benin and MTN/Moov/Orange Côte d'Ivoire. USD/EUR wallet credits remain
disabled until ZENO has an approved FX quote and settlement source. The client
opens only a validated PayDunya sandbox checkout URL, then reads the operation
status from the authenticated backend.

The `paydunya-webhook` function verifies PayDunya's documented SHA-512 hash,
confirms invoice status directly with PayDunya, checks the invoice token and
amount, deduplicates callback events, and only then posts the XOF credit through
an atomic database function. Pending or failed payments do not credit a wallet.
The raw callback is not persisted.

The PayDunya PUSH path is implemented for test credentials only. It requires a
private key beginning with `test_`, verifies the PIN server-side, reserves the
XOF wallet balance in the ledger before submission, reconciles status, and
returns the funds through a compensating ledger transaction if PayDunya reports
a definitive failure. The app refreshes its balance while a payout is pending.

The official PUSH documentation uses `/api/v2/disburse/*` on the main API host
and shows test credentials, but does not document a separate sandbox hostname.
The test path calls that documented host only when the private key begins with
`test_`; production private keys cannot pass the code guard. Validate the payout
result in PayDunya's test dashboard before relying on it. PayDunya's dashboard
must have disbursements enabled for the application.

Payouts use the ZENO merchant balance at PayDunya. Confirm that this balance is
funded and the merchant country account is configured before expecting a payout
to succeed. ZENO does not yet display provider fees; the current sandbox receipt
shows zero fees.

ZENO fees are zero for the MVP. Provider fees are unknown and must be supplied
by the selected provider before the final review/receipt can display a total.
The client preview and client-provided conversion values are never financial
inputs to the server.

## Persistence and ledger rules

`mobile_money_operations` records the provider lifecycle separately from the
immutable ledger. Its idempotency key is unique per user, request terms are
immutable, and only valid state transitions are allowed. `succeeded` requires
an immutable ledger transaction reference. Pending, failed, or expired
operations do not change wallet balances.

`mobile_money_webhook_events` records a unique provider event id and a payload
hash, not the raw provider payload. The provider adapter must verify the
provider's signature before an event is accepted. Duplicate callbacks must be
safe to acknowledge without posting a second ledger transaction.

For a deposit, only provider-confirmed funds may be credited. For a withdrawal,
the server must reserve/debit available wallet funds atomically before payout
and post a compensating refund if the provider definitively fails. A timeout is
not a failure: it remains pending until a verified callback or provider status
query resolves it.

The current ledger supports balanced entries per currency. Cross-currency
Mobile Money settlement (XOF provider settlement and USD/EUR wallet credit or
debit) needs an explicit FX/clearing posting design and a trusted, timestamped
rate source before it can be enabled. Do not treat the UI's indicative rate as
the settlement rate.

## Provider adapter contract

The PayDunya invoice adapter uses these server-only Supabase function secrets:

- `PAYDUNYA_MODE=sandbox`
- `PAYDUNYA_MASTER_KEY`
- `PAYDUNYA_PRIVATE_KEY`
- `PAYDUNYA_TOKEN`

Never add these to EAS or `EXPO_PUBLIC_*`. Deploy `zeno-financial-api`,
`paydunya-webhook`, and the migrations before trying the in-app sandbox flow.
The webhook URL is the project's Supabase Edge Function URL. In PayDunya's
AppDunya, enable the exact collection channels and configure the callback
through invoice `actions.callback_url` (the integration supplies it per invoice).

The general `MobileMoneyProvider` boundary remains available for other
providers; implement another adapter only from that provider's official
integration contract:

- `initiateCollection` for deposits;
- `initiatePayout` for withdrawals;
- `verifyWebhook` for signed callbacks;
- `getOperationStatus` for reconciliation and recovery after timeouts.

Keep credentials in server-only environment variables. Never expose them via
`EXPO_PUBLIC_*`. Log provider operation ids and references, but redact phone
numbers and provider payloads.

## Needed before production

- Sandbox account and API credentials;
- Official API reference and base URLs;
- Supported collection/payout operators and countries;
- Request and response examples, including idempotency behavior;
- Webhook signature algorithm, headers, retry behavior, and event ids;
- Status-query/reconciliation endpoint and transaction lifecycle;
- Provider fee rules, payout settlement currency, and limits;
- Trusted FX quote source/rules for USD/EUR wallet settlement.

- PayDunya confirmation of test payout behavior and the applicable merchant
  balance/account setup before making the payout path available to testers.
- Approved production KYB, legal funds flow, settlement/merchant balance,
  payout rules, fee schedule, and supported country/channel matrix.
- Trusted USD/EUR FX quote and clearing rules before cross-currency credits.
- Production callback reachability, reconciliation procedure, and operator
  failure/refund cases.
