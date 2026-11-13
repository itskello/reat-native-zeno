import { getMobileMoneyProvider } from "@/lib/server/mobile-money-provider";
import { readMobileMoneyRecipient, readPositiveAmount } from "@/lib/server/mobile-money-validation";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { rateLimit } from "@/lib/server/rate-limit";

/** Creates a Mobile Money collection only when a verified provider adapter is configured. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const limit = rateLimit(`mobile-money:deposit:${auth.userId}`, 8, 60);
  if (!limit.allowed) return json({ error: "Too many deposit attempts. Try again shortly." }, 429, limit.retryAfter);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const recipient = readMobileMoneyRecipient(body);
  if (!recipient.ok) return json({ error: recipient.error }, 400);
  if (!(["USD", "EUR", "XOF", "GHS", "NGN", "XAF", "CDF"] as unknown[]).includes(body?.walletCurrency)) {
    return json({ error: "Choose a supported wallet currency." }, 400);
  }
  const amountXof = readPositiveAmount(body?.amountXof, "XOF");
  if (amountXof === null) return json({ error: "Enter a valid deposit amount in XOF." }, 400);

  if (!getMobileMoneyProvider()) {
    return json({ error: "Les dépôts Mobile Money ne sont pas encore activés. Le prestataire doit d’abord être configuré." }, 503);
  }

  // Do not create a pending record or claim that the customer approved a
  // collection until a provider response can be verified and persisted.
  return json({ error: "The Mobile Money provider adapter is unavailable." }, 503);
}
