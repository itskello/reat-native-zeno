# KYC provider decision

## Current decision

Didit is the selected provider for the first sandbox integration. The app uses
Didit's React Native SDK to keep identity capture inside ZENO. A Supabase Edge
Function creates sessions and returns the short-lived session token to the
authenticated app; it receives signed status webhooks. AiPrise remains a
comparison option before choosing a production provider; no production KYC
provider has been selected.

The Didit workflow is configured for the ZENO Sandbox application. Do not treat
sandbox sessions as production verification results or use production identity
documents during setup.

## Before implementation

- Confirm the exact accepted Benin and Côte d'Ivoire identity documents with
  each provider.
- Compare the same KYC flow, including identity document, selfie/liveness,
  face match, any AML checks, and manual review.
- Obtain AiPrise's production quote; compare Didit's published
  usage price against the same set of checks.
- Review data processing, retention, deletion, and residency terms.
- Complete sandbox session and callback checks before enabling submissions in
  production.

The Didit native SDK collects identity documents and performs the configured
checks inside the mobile app. ZENO does not upload or store those photos. The
Didit session token is sensitive, short-lived, and must not be persisted or
logged. The signed webhook is authoritative for final KYC status; ZENO must not
report a result as verified based only on the SDK's client-side result.

The SDK adds a native module and requires a new development build. The Expo
config plugin uses the `autodetection` variant without NFC because NFC is not
enabled in the selected workflow. Expo Go cannot load this SDK.
