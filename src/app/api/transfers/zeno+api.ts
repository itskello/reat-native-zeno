import { createServerSupabaseClient } from "@/lib/server/supabase";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { verifyTransactionPin } from "@/lib/server/pin";

type Currency = "USD" | "EUR" | "XOF";

/** Sends wallet funds to another ZENO user, posting both sides atomically. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`transfer:zeno:${auth.userId}`, 20, 60);
  if (!limit.allowed) {
    return json({ error: "Too many transfer attempts. Try again shortly." }, 429, limit.retryAfter);
  }

  const body = await request.json().catch(() => null) as {
    recipientId?: unknown;
    amount?: unknown;
    currency?: unknown;
    pin?: unknown;
    idempotencyKey?: unknown;
  } | null;

  const recipientId = typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
  const currency = body?.currency;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  if (!recipientId || recipientId.length > 128 || recipientId === auth.userId) {
    return json({ error: "Choose a valid ZENO recipient." }, 400);
  }
  if (currency !== "USD" && currency !== "EUR" && currency !== "XOF") {
    return json({ error: "Choose a supported wallet currency." }, 400);
  }
  const amountMinor = toMinorUnits(body?.amount, currency);
  if (amountMinor === null) {
    return json({ error: "Enter an amount using the supported precision for this currency." }, 400);
  }
  if (!/^\d{6}$/.test(pin)) return json({ error: "Enter your 6-digit transaction PIN." }, 400);
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return json({ error: "Transfer reference is invalid. Review the transfer and try again." }, 400);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data: pinRecord, error: pinReadError } = await supabase
      .from("user_security_pins")
      .select("salt, pin_hash, failed_attempts, locked_until")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (pinReadError) throw pinReadError;
    if (!pinRecord) {
      return json({ error: "Set up your transaction PIN before sending money." }, 428);
    }
    if (pinRecord.locked_until && new Date(pinRecord.locked_until).getTime() > Date.now()) {
      return json({ error: "PIN temporarily locked after too many attempts. Try again in 15 minutes." }, 423);
    }

    const validPin = await verifyTransactionPin(pin, pinRecord.salt, pinRecord.pin_hash);
    if (!validPin) {
      const { error } = await supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
      if (error) throw error;
      return json({ error: "Incorrect transaction PIN." }, 401);
    }

    const { error: resetError } = await supabase.rpc("reset_pin_failures", { p_user_id: auth.userId });
    if (resetError) throw resetError;

    const [sender, recipient] = await Promise.all([
      auth.clerk.users.getUser(auth.userId),
      auth.clerk.users.getUser(recipientId),
    ]);
    const senderName = displayName(sender);
    const recipientName = displayName(recipient);
    const reference = await makeReference(auth.userId, idempotencyKey);

    const { data, error } = await supabase.rpc("transfer_zeno_wallet", {
      p_sender_user_id: auth.userId,
      p_recipient_user_id: recipient.id,
      p_idempotency_key: idempotencyKey,
      p_reference: reference,
      p_currency: currency,
      p_amount_minor: amountMinor,
      p_sender_name: senderName,
      p_recipient_name: recipientName,
    });

    if (error) {
      if (error.message.includes("Insufficient wallet balance")) {
        return json({ error: "Your wallet balance is too low for this transfer." }, 422);
      }
      if (error.code === "23505") {
        return json({ error: "This transfer reference was already used. Review your transaction history." }, 409);
      }
      console.error("[api/transfers/zeno] Ledger transfer failed:", error);
      return json({ error: "The transfer could not be completed. Check your history before retrying." }, 502);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.transaction_id || !row?.created_at) {
      console.error("[api/transfers/zeno] Ledger returned an incomplete transfer receipt.");
      return json({ error: "The transfer was recorded but its receipt could not be loaded. Check your history." }, 502);
    }

    const amount = amountMinor / (currency === "XOF" ? 1 : 100);
    return json({
      transfer: {
        id: row.transaction_id,
        reference,
        status: "completed",
        amount,
        currency,
        fee: 0,
        totalAmount: amount,
        createdAt: row.created_at,
        recipientName,
        paymentMethod: "ZENO Wallet",
      },
    }, 201);
  } catch (cause) {
    console.error("[api/transfers/zeno] Transfer service unavailable:", cause);
    return json({ error: "The transfer service is temporarily unavailable. Try again shortly." }, 503);
  }
}

function toMinorUnits(value: unknown, currency: Currency): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const text = String(value);
  if (/[eE]/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const digits = currency === "XOF" ? 0 : 2;
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction) || fraction.length > digits) return null;
  const minor = Number(whole) * (digits === 0 ? 1 : 100) + Number(fraction.padEnd(digits, "0") || "0");
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

function displayName(user: { firstName: string | null; lastName: string | null; username: string | null }) {
  return [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ")
    .trim() || user.username || "ZENO User";
}

async function makeReference(userId: string, idempotencyKey: string) {
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${userId}:${idempotencyKey}`),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24)
    .toUpperCase();
  return `ZP2P-${hash}`;
}
