# ZENO support chat setup

## Architecture

- Clerk authenticates each customer and support agent.
- Stream stores the conversation and delivers new messages in real time.
- Each customer has one private support thread. Opening support resumes that thread; users do not create parallel conversations. A human agent takes over the same thread without losing its history.
- Stream's `inactive-channels` retention policy is configured for 72 hours. It permanently deletes inactive chat channels across the entire Stream app, including support and any other chat channels. Stream applies a 24-hour grace period before cleanup starts, then runs deletion asynchronously, so deletion may occur later than the 72-hour inactivity threshold. Do not add unrelated chat channels to this Stream app without accounting for this policy.
- The Stream API secret stays on the server. The app asks ZENO's authenticated API for a short-lived user token.
- The agent inbox is available at `/settings/support-agent`; its API requires `privateMetadata.supportRole = "agent"` on the agent's Clerk user.
- Messages do not cause money movement. Gemini answers general product questions and posts replies into the same Stream thread. Account-specific, transaction, fraud, dispute, KYC, and uncertain requests are handed to the human support inbox.
- The assistant receives only recent message text, with common email and phone/account-number patterns redacted. Never ask customers to send credentials, PINs, OTPs, CVV, or full card details.

## Required environment values

Set these on the API server and the local Expo app as appropriate:

```env
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_API_TIER=free
```

To configure or reapply the Stream retention policy from the project root, run `npm run support:retention`. This is an app-wide destructive setting; the script prints existing policies before setting `inactive-channels` to 72 hours.

The app key may be public. Do not expose `STREAM_API_SECRET` with an `EXPO_PUBLIC_` prefix or commit it.
Keep the Gemini key server-only. The free Gemini tier may use prompts and responses to improve Google products, so use it only in development with synthetic conversations. Production is guarded to require `GEMINI_API_TIER=paid`; configure billing and review Google's current data terms before sending any real customer support content.

## Agent access

In Clerk, set the trusted support staff member's **private metadata** to:

```json
{"supportRole":"agent"}
```

Do not grant this metadata from client-side code. The inbox endpoint verifies the role on every request. An agent opens `/settings/support-agent`, selects a waiting conversation, and replies in that same Stream thread.

## API routes

- `GET /api/support/conversation` — returns the customer's single primary thread without creating a channel.
- `POST /api/support/conversation` — resumes the customer's primary thread, creating it only on first contact, and verifies ownership before issuing credentials.
- `POST /api/support/handoff` — verifies thread ownership and marks that specific thread as waiting for an agent.
- `POST /api/support/assistant` — verifies the latest customer message and thread ownership, sends a redacted recent conversation to Gemini, and posts a general answer or escalates that same thread to the agent inbox.
- `GET /api/support/agent/inbox` — staff-only list of conversations awaiting or receiving human support.
- `POST /api/support/agent/inbox` — staff-only claim of an existing conversation and returns an agent token.

## Assistant boundaries

The assistant currently provides general product guidance; it is not connected to account, ledger, transaction, or KYC data. It must never claim to have performed a financial action. The production guard intentionally rejects requests unless the operator sets `GEMINI_API_TIER=paid` after configuring a paid Gemini project. Add reviewed, versioned ZENO help content before expanding the assistant's answers.
