import { createHmac, timingSafeEqual } from "crypto";
import { requireEnv } from "@/lib/server/env";

type DiditWebhookEnvelope = {
  event_id?: unknown;
  webhook_type?: unknown;
  timestamp?: unknown;
  session_id?: unknown;
  status?: unknown;
  application_id?: unknown;
};

/** Validates Didit's full-payload webhook signatures and replay window. */
export function verifyDiditWebhook(
  rawBody: string,
  headers: Headers,
  payload: DiditWebhookEnvelope,
): boolean {
  const timestampHeader = headers.get("x-timestamp");
  const timestamp = Number(timestampHeader);
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return false;
  }

  const activeSecret = requireEnv("DIDIT_WEBHOOK_SIGNING_SECRET");
  const previousSecret = process.env.DIDIT_WEBHOOK_SIGNING_SECRET_PREVIOUS?.trim();
  const canonical = canonicalJson(payload);

  if (matchesHmac(activeSecret, canonical, headers.get("x-signature-v2"))) return true;
  if (matchesHmac(activeSecret, rawBody, headers.get("x-signature"))) return true;
  if (
    previousSecret &&
    (matchesHmac(previousSecret, canonical, headers.get("x-signature-v2-previous")) ||
      matchesHmac(previousSecret, rawBody, headers.get("x-signature-previous")))
  ) {
    return true;
  }
  return false;
}

function matchesHmac(secret: string, value: string, provided: string | null) {
  if (!provided || !/^[a-f\d]{64}$/i.test(provided)) return false;
  const expected = createHmac("sha256", secret).update(value, "utf8").digest();
  const actual = Buffer.from(provided, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Didit V2 signs compact JSON with sorted keys and Unicode left unescaped. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

export function diditDecision(status: unknown) {
  switch (status) {
    case "Approved":
      return "verified" as const;
    case "Declined":
      return "rejected" as const;
    case "Abandoned":
    case "Expired":
    case "Kyc Expired":
      return "failed" as const;
    default:
      return null;
  }
}
