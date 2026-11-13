import { getMobileMoneyProvider } from "@/lib/server/mobile-money-provider";
import { readMobileMoneyRecipient, readPositiveAmount } from "@/lib/server/mobile-money-validation";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { rateLimit } from "@/lib/server/rate-limit";

/** Creates a payout only when a verified provider adapter is configured. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const limit = rateLimit(`mobile-money:withdrawal:${auth.userId}`, 8, 60);
  if (!limit.allowed) return json({ error: "Too many withdrawal attempts. Try again shortly." }, 429, limit.retryAfter);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const recipient = readMobileMoneyRecipient(body);
  if (!recipient.ok) return json({ error: recipient.error }, 400);
  const currency = body?.currency;
  if (!(["USD", "EUR", "XOF", "GHS", "NGN", "XAF", "CDF"] as unknown[]).includes(currency)) {
    return json({ error: "Choose a supported wallet currency." }, 400);
  }
  if (readPositiveAmount(body?.amount, currency) === null) {
    return json({ error: "Enter a valid withdrawal amount." }, 400);
  }
  if (typeof body?.recipientName !== "string" || !body.recipientName.trim() || body.recipientName.trim().length > 120) {
    return json({ error: "Enter a valid recipient name." }, 400);
  }
  if (typeof body?.pin !== "string" || !/^\d{6}$/.test(body.pin)) {
    return json({ error: "Enter your 6-digit transaction PIN." }, 400);
  }

  if (!getMobileMoneyProvider()) {
    return json({ error: "The Mobile Money withdrawal service is not configured yet." }, 503);
  }

  // Never debit the wallet until provider pricing, payout semantics and a
  // verified callback can be handled in the same operation lifecycle.
  return json({ error: "The Mobile Money provider adapter is unavailable." }, 503);
}
