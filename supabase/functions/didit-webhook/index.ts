type DiditWebhookPayload = {
  event_id?: unknown;
  webhook_type?: unknown;
  timestamp?: unknown;
  session_id?: unknown;
  status?: unknown;
};

type KycSubmission = {
  id: string;
  user_id: string;
  status: "pending" | "verified" | "rejected" | "failed";
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-timestamp, x-signature, x-signature-v2, x-signature-previous, x-signature-v2-previous",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405, { allow: "POST, OPTIONS" });
  }

  let rawBody: string;
  let payload: DiditWebhookPayload;
  try {
    rawBody = await request.text();
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Invalid webhook payload." }, 400);
    }
    payload = parsed as DiditWebhookPayload;
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }

  const signingSecret = Deno.env.get("DIDIT_WEBHOOK_SIGNING_SECRET")?.trim();
  if (!signingSecret) {
    console.error("[didit-webhook] DIDIT_WEBHOOK_SIGNING_SECRET is not configured.");
    return json({ error: "Webhook receiver is not configured." }, 503);
  }
  if (!(await verifyDiditWebhook(rawBody, request.headers, payload, signingSecret))) {
    return json({ error: "Invalid webhook signature." }, 401);
  }

  if (payload.webhook_type !== "status.updated" || typeof payload.session_id !== "string") {
    return json({ received: true, processed: false });
  }

  const decision = diditDecision(payload.status);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseSecret = getSupabaseAdminKey();
  if (!supabaseUrl || !supabaseSecret) {
    console.error("[didit-webhook] Supabase server credentials are not configured.");
    return json({ error: "Webhook receiver is not configured." }, 503);
  }

  try {
    const submission = await findSubmission(supabaseUrl, supabaseSecret, payload.session_id);
    // Didit's webhook tester may send a sample session that ZENO did not create.
    if (!submission) return json({ received: true, processed: false });

    const eventId = typeof payload.event_id === "string" && payload.event_id
      ? payload.event_id
      : `${payload.session_id}:${payload.webhook_type}:${String(payload.status ?? "unknown")}`;
    const eventFingerprint = await sha256(eventId);
    const resultCode = typeof payload.status === "string" ? payload.status : "unknown";

    await recordEvent(supabaseUrl, supabaseSecret, submission.id, eventFingerprint, resultCode);

    let effectiveStatus = submission.status;
    if (decision && submission.status === "pending") {
      const updated = await applyDecision(
        supabaseUrl,
        supabaseSecret,
        submission.id,
        decision,
        resultCode,
      );
      effectiveStatus = updated?.status ??
        (await findSubmissionStatus(supabaseUrl, supabaseSecret, submission.id)) ?? "pending";
    }

    if (["verified", "rejected", "failed"].includes(effectiveStatus)) {
      await syncClerkKycStatus(submission.user_id, effectiveStatus);
    }

    return json({ received: true, processed: true });
  } catch (error) {
    console.error("[didit-webhook] Event processing failed:", error);
    return json({ error: "Could not process the verification event." }, 500);
  }
});

async function verifyDiditWebhook(
  rawBody: string,
  headers: Headers,
  payload: DiditWebhookPayload,
  secret: string,
): Promise<boolean> {
  const timestamp = Number(headers.get("x-timestamp"));
  if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const previousSecret = Deno.env.get("DIDIT_WEBHOOK_SIGNING_SECRET_PREVIOUS")?.trim();
  const canonical = canonicalJson(payload);
  const candidates = [
    { header: "x-signature-v2", previousHeader: "x-signature-v2-previous", body: canonical },
    { header: "x-signature", previousHeader: "x-signature-previous", body: rawBody },
  ];

  for (const candidate of candidates) {
    const currentSignature = headers.get(candidate.header);
    if (currentSignature && await matchesHmac(secret, candidate.body, currentSignature)) return true;
    const oldSignature = headers.get(candidate.previousHeader);
    if (previousSecret && oldSignature && await matchesHmac(previousSecret, candidate.body, oldSignature)) {
      return true;
    }
  }
  return false;
}

async function matchesHmac(secret: string, body: string, signature: string): Promise<boolean> {
  if (!/^[a-f\d]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  const actual = Uint8Array.from(signature.match(/.{2}/g)!, (pair) => Number.parseInt(pair, 16));
  let mismatch = expected.length ^ actual.length;
  for (let index = 0; index < expected.length; index++) mismatch |= expected[index] ^ actual[index];
  return mismatch === 0;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
}

function diditDecision(status: unknown): "verified" | "rejected" | "failed" | null {
  switch (status) {
    case "Approved": return "verified";
    case "Declined": return "rejected";
    case "Abandoned":
    case "Expired":
    case "Kyc Expired": return "failed";
    default: return null;
  }
}

function supabaseHeaders(secret: string, extra: Record<string, string> = {}) {
  return {
    apikey: secret,
    "content-type": "application/json",
    ...extra,
  };
}

function getSupabaseAdminKey() {
  const namedSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (namedSecretKeys) {
    try {
      const keys = JSON.parse(namedSecretKeys) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      console.error("[didit-webhook] Supabase secret-key map is invalid.");
      return null;
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ??
    Deno.env.get("SUPABASE_SECRET_KEY")?.trim() ?? null;
}

function restUrl(base: string, table: string, query: Record<string, string>) {
  const url = new URL(`/rest/v1/${table}`, base);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url;
}

async function findSubmission(base: string, secret: string, providerJobId: string) {
  const response = await fetch(restUrl(base, "kyc_submissions", {
    select: "id,user_id,status",
    provider: "eq.didit",
    provider_job_id: `eq.${providerJobId}`,
    limit: "1",
  }), { headers: supabaseHeaders(secret) });
  if (!response.ok) throw new Error(`Supabase KYC lookup failed (${response.status}).`);
  const rows = await response.json() as KycSubmission[];
  return rows[0] ?? null;
}

async function findSubmissionStatus(base: string, secret: string, submissionId: string) {
  const response = await fetch(restUrl(base, "kyc_submissions", {
    select: "status",
    id: `eq.${submissionId}`,
    limit: "1",
  }), { headers: supabaseHeaders(secret) });
  if (!response.ok) throw new Error(`Supabase KYC status lookup failed (${response.status}).`);
  const rows = await response.json() as Array<{ status: KycSubmission["status"] }>;
  return rows[0]?.status ?? null;
}

async function recordEvent(
  base: string,
  secret: string,
  submissionId: string,
  fingerprint: string,
  resultCode: string,
) {
  const response = await fetch(restUrl(base, "kyc_provider_events", {
    on_conflict: "submission_id,event_fingerprint",
  }), {
    method: "POST",
    headers: supabaseHeaders(secret, { prefer: "resolution=ignore-duplicates,return=minimal" }),
    body: JSON.stringify({
      submission_id: submissionId,
      event_fingerprint: fingerprint,
      result_code: resultCode,
      signature_verified: true,
    }),
  });
  if (!response.ok) throw new Error(`Supabase KYC event insert failed (${response.status}).`);
}

async function applyDecision(
  base: string,
  secret: string,
  submissionId: string,
  status: "verified" | "rejected" | "failed",
  resultCode: string,
) {
  const response = await fetch(restUrl(base, "kyc_submissions", {
    id: `eq.${submissionId}`,
    status: "eq.pending",
  }), {
    method: "PATCH",
    headers: supabaseHeaders(secret, { prefer: "return=representation" }),
    body: JSON.stringify({ status, result_code: resultCode }),
  });
  if (!response.ok) throw new Error(`Supabase KYC decision update failed (${response.status}).`);
  const rows = await response.json() as Array<{ status: KycSubmission["status"] }>;
  return rows[0] ?? null;
}

async function syncClerkKycStatus(userId: string, status: string) {
  const clerkSecret = Deno.env.get("CLERK_SECRET_KEY")?.trim();
  if (!clerkSecret) throw new Error("CLERK_SECRET_KEY is not configured.");
  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}/metadata`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${clerkSecret}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ public_metadata: { kycStatus: status } }),
  });
  if (!response.ok) throw new Error(`Clerk KYC metadata update failed (${response.status}).`);
}

async function sha256(value: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", ...extraHeaders },
  });
}
