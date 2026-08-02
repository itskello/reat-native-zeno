import { verifyOtp } from "@/lib/server/otp";
import { rateLimit } from "@/lib/server/rate-limit";
import { isE164 } from "@/lib/phone";

/**
 * POST /api/otp/verify
 * Body: { phone: string, token: string, code: string }
 * Returns: { verified: true } or a 4xx with an error message.
 *
 * The token is the one issued by /api/otp/send. Verification is a pure signature
 * + hash check — no code was ever stored to look up.
 */
export async function POST(request: Request) {
  let phone: string;
  let token: string;
  let code: string;

  try {
    const body = (await request.json()) as {
      phone?: unknown;
      token?: unknown;
      code?: unknown;
    };
    phone = String(body.phone ?? "").trim();
    token = String(body.token ?? "");
    code = String(body.code ?? "").replace(/\D/g, "");
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  if (!isE164(phone) || !token || code.length === 0) {
    return json({ error: "Missing verification details." }, 400);
  }

  // Cap guesses per number so a signed token cannot be brute-forced within its
  // five-minute life (10^6 space, but no reason to allow more than a handful).
  const attempts = rateLimit(`otp:verify:${phone}`, 5, 15 * 60);

  if (!attempts.allowed) {
    return json(
      { error: "Too many attempts. Please request a new code." },
      429,
      attempts.retryAfter
    );
  }

  const result = verifyOtp(token, phone, code);

  if (result.ok) {
    return json({ verified: true });
  }

  const message =
    result.reason === "expired"
      ? "This code has expired. Please request a new one."
      : "That code is incorrect. Please try again.";

  return json({ error: message }, 400);
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
