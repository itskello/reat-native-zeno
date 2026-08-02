/// <reference types="node" />
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@/lib/server/env";

/**
 * Stateless phone OTP.
 *
 * We do NOT store the code server-side. At send time the code is hashed and
 * sealed — together with the target number and an expiry — into a signed token
 * that the client carries back at verify time. This gives a production-safe MVP
 * without introducing a database yet (AGENTS.md forbids unnecessary infra for
 * this version): the secret never leaves the server, so a stolen token cannot
 * be forged or its code recovered.
 *
 * The real, once-verified phone number is written onto the Clerk user by the
 * client; this layer only proves the user controls the number.
 */

const CODE_LENGTH = 6;
const TTL_SECONDS = 5 * 60;

function secret() {
  return requireEnv("OTP_SIGNING_SECRET");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function hashCode(phone: string, code: string) {
  // Binding the hash to the phone stops a token minted for one number being
  // replayed against another.
  return createHmac("sha256", secret())
    .update(`${phone}:${code}`)
    .digest("base64url");
}

export type IssuedOtp = {
  /** Opaque token the client stores and returns at verify time. */
  token: string;
  /** Plain code — only ever handed to the SMS provider, never to the client. */
  code: string;
  expiresAt: number;
};

export function issueOtp(phone: string): IssuedOtp {
  // randomInt is rejection-sampled and cryptographically secure, unlike
  // Math.random which must never generate a security code.
  const code = String(randomInt(0, 10 ** CODE_LENGTH)).padStart(
    CODE_LENGTH,
    "0"
  );
  const expiresAt = nowSeconds() + TTL_SECONDS;
  const body = `${phone}.${hashCode(phone, code)}.${expiresAt}`;
  const token = `${toBase64Url(body)}.${sign(body)}`;

  return { token, code, expiresAt };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "malformed" };

export function verifyOtp(
  token: string,
  phone: string,
  code: string
): VerifyResult {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return { ok: false, reason: "malformed" };
  }

  const [encodedBody, providedSignature] = parts;
  const body = fromBase64Url(encodedBody);

  if (!body || !safeEquals(sign(body), providedSignature)) {
    return { ok: false, reason: "malformed" };
  }

  const [tokenPhone, expectedCodeHash, expiresAtRaw] = body.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (tokenPhone !== phone || !Number.isFinite(expiresAt)) {
    return { ok: false, reason: "malformed" };
  }

  if (nowSeconds() > expiresAt) {
    return { ok: false, reason: "expired" };
  }

  if (!safeEquals(hashCode(phone, code), expectedCodeHash)) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true };
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  try {
    return Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Constant-time comparison so a mismatch leaks no timing information. */
function safeEquals(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}
