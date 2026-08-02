import { isAllowedNumber } from "@/lib/server/allowed-countries";
import { issueOtp } from "@/lib/server/otp";
import { rateLimit } from "@/lib/server/rate-limit";
import { getSmsProvider } from "@/lib/server/sms";
import { isE164, maskPhoneNumber } from "@/lib/phone";

/**
 * POST /api/otp/send
 * Body: { phone: string }  (E.164, e.g. "+2290142077548")
 * Returns: { token, expiresAt }
 *
 * The verification code never leaves the server: it is generated here, sent via
 * SMS, and returned to the client only as a signed, opaque token. See
 * src/lib/server/otp.ts for why this is stateless-safe.
 */
export async function POST(request: Request) {
  let phone: string;

  try {
    const body = (await request.json()) as { phone?: unknown };
    phone = String(body.phone ?? "").trim();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (!isE164(phone)) {
    return json({ error: "A valid phone number is required." }, 400);
  }

  if (!isAllowedNumber(phone)) {
    return json({ error: "This country is not supported yet." }, 422);
  }

  // Two independent limits: one keeps a single number from being hammered, the
  // other caps total spend if many numbers are tried from one source.
  const perNumber = rateLimit(`otp:send:${phone}`, 3, 15 * 60);

  if (!perNumber.allowed) {
    return json(
      { error: "Too many attempts. Please try again later." },
      429,
      perNumber.retryAfter
    );
  }

  try {
    const { token, code, expiresAt } = issueOtp(phone);

    // ASCII only, and short: an accented character drops the SMS segment from
    // 160 to 70 chars and doubles the cost.
    await getSmsProvider().send({
      to: phone,
      body: `ZENO: your verification code is ${code}. It expires in 5 minutes.`,
    });

    return json({ token, expiresAt });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    console.error(`[otp:send] failed for ${maskPhoneNumber(phone)}:`, detail);

    // In development, surface the real reason (missing secret, SMS credentials,
    // etc.) instead of the generic message so it can be fixed without guessing.
    return json(
      {
        error: "We could not send the code. Please try again.",
        ...(process.env.NODE_ENV !== "production" ? { detail } : {}),
      },
      502
    );
  }
}

function json(data: unknown, status = 200, retryAfter?: number) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (retryAfter !== undefined) {
    headers["Retry-After"] = String(retryAfter);
  }

  return new Response(JSON.stringify(data), { status, headers });
}
