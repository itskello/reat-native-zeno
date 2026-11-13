import { createClerkClient, verifyToken } from "npm:@clerk/backend@3.26.4";

const DIDIT_WORKFLOW_ID = "bc8443ba-21b1-4fa5-96a0-4bf9705313dd";
const DIDIT_CREATE_SESSION_URL = "https://verification.didit.me/v3/session/";
const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

type RequestBody = {
  countryId?: unknown;
  language?: unknown;
};

type DiditSession = {
  session_id?: unknown;
  session_token?: unknown;
};

type KycSubmission = {
  id: string;
  provider_job_id: string;
  country_id: string;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405, { allow: "POST, OPTIONS" });

  const secretKey = Deno.env.get("CLERK_SECRET_KEY")?.trim();
  const diditApiKey = Deno.env.get("DIDIT_API_KEY")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAdminKey = getSupabaseAdminKey();
  if (!secretKey || !diditApiKey || !supabaseUrl || !supabaseAdminKey) {
    console.error("[didit-create-session] Required server credentials are missing.");
    return json({ error: "Identity verification is not configured." }, 503);
  }

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) return json({ error: "Sign in to continue." }, 401);

  let userId: string;
  let clerk: ReturnType<typeof createClerkClient>;
  try {
    const claims = await verifyToken(token, { secretKey });
    if (typeof claims.sub !== "string" || !claims.sub) return json({ error: "Invalid session." }, 401);
    userId = claims.sub;
    clerk = createClerkClient({ secretKey });
  } catch {
    return json({ error: "Invalid session." }, 401);
  }

  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  if (body.countryId !== "benin" && body.countryId !== "cote-divoire") {
    return json({ error: "Verification is currently available in Benin and Côte d’Ivoire." }, 400);
  }
  const language = body.language === "fr" ? "fr" : "en";
  const countryCode = body.countryId === "benin" ? "BEN" : "CIV";

  try {
    const clerkUser = await clerk.users.getUser(userId);
    if (clerkUser.publicMetadata.kycStatus === "verified") {
      return json({ error: "Your identity is already verified." }, 409);
    }

    const existing = await findPendingSubmission(supabaseUrl, supabaseAdminKey, userId);
    const consentGivenAt = new Date().toISOString();

    const diditResponse = await fetch(DIDIT_CREATE_SESSION_URL, {
      method: "POST",
      headers: {
        "x-api-key": diditApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        vendor_data: userId,
        language,
        expected_details: { id_country: countryCode },
        biometric_consent: {
          given_at: consentGivenAt,
          text_version: "zeno-didit-biometric-consent-v1",
        },
        metadata: {
          zeno_country_id: body.countryId,
          biometric_consent_version: "zeno-didit-biometric-consent-v1",
          biometric_consent_given_at: consentGivenAt,
        },
      }),
    });

    if (!diditResponse.ok) {
      console.error("[didit-create-session] Didit rejected the session request:", diditResponse.status);
      return json({ error: "Didit could not start the verification. Please try again." }, 502);
    }

    const session = await diditResponse.json() as DiditSession;
    if (
      typeof session.session_id !== "string" ||
      typeof session.session_token !== "string" ||
      !session.session_token.trim()
    ) {
      console.error("[didit-create-session] Didit returned an invalid native session response.");
      return json({ error: "Didit returned an invalid verification session." }, 502);
    }

    if (existing && existing.provider_job_id !== session.session_id) {
      return json({ error: "A verification is already in progress for this account." }, 409);
    }
    if (existing && existing.country_id !== body.countryId) {
      return json({ error: "The country cannot be changed while a verification is in progress." }, 409);
    }

    if (!existing) {
      await createPendingSubmission(supabaseUrl, supabaseAdminKey, {
        user_id: userId,
        idempotency_key: `didit:${session.session_id}`,
        provider: "didit",
        provider_job_id: session.session_id,
        country_id: body.countryId,
        document_type: "provider_selected",
      });
    }

    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { kycStatus: "pending" },
    });

    return json({ status: "pending", sessionToken: session.session_token });
  } catch (error) {
    console.error("[didit-create-session] Session creation failed:", error);
    return json({ error: "Could not start identity verification." }, 500);
  }
});

function bearerToken(value: string | null) {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function getSupabaseAdminKey() {
  const namedSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (namedSecretKeys) {
    try {
      const keys = JSON.parse(namedSecretKeys) as Record<string, string>;
      if (keys.default) return keys.default;
    } catch {
      console.error("[didit-create-session] Supabase secret-key map is invalid.");
      return null;
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? null;
}

function supabaseHeaders(secret: string, extra: Record<string, string> = {}) {
  return { apikey: secret, "content-type": "application/json", ...extra };
}

function restUrl(base: string, table: string, query: Record<string, string>) {
  const url = new URL(`/rest/v1/${table}`, base);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
  return url;
}

async function findPendingSubmission(base: string, secret: string, userId: string) {
  const response = await fetch(restUrl(base, "kyc_submissions", {
    select: "id,provider_job_id,country_id",
    user_id: `eq.${userId}`,
    provider: "eq.didit",
    status: "eq.pending",
    limit: "1",
  }), { headers: supabaseHeaders(secret) });
  if (!response.ok) throw new Error(`Supabase KYC lookup failed (${response.status}).`);
  const rows = await response.json() as KycSubmission[];
  return rows[0] ?? null;
}

async function createPendingSubmission(
  base: string,
  secret: string,
  submission: Record<string, string>,
) {
  const response = await fetch(restUrl(base, "kyc_submissions", {
    on_conflict: "provider_job_id",
  }), {
    method: "POST",
    headers: supabaseHeaders(secret, { prefer: "resolution=ignore-duplicates,return=minimal" }),
    body: JSON.stringify(submission),
  });
  if (!response.ok) throw new Error(`Supabase KYC submission insert failed (${response.status}).`);
}

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", ...extraHeaders },
  });
}
