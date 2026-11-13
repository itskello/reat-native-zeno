import { createHash } from "crypto";
import { createClerkClient } from "@clerk/backend";
import { createServerSupabaseClient } from "@/lib/server/supabase";
import { json } from "@/lib/server/recipients-auth";
import { diditDecision, verifyDiditWebhook } from "@/lib/server/didit-webhook";

type DiditWebhookPayload = {
  event_id?: unknown;
  webhook_type?: unknown;
  timestamp?: unknown;
  session_id?: unknown;
  status?: unknown;
  application_id?: unknown;
};

/** Receives verified Didit session events; never stores the document payload. */
export async function POST(request: Request) {
  let rawBody: string;
  let payload: DiditWebhookPayload;

  try {
    rawBody = await request.text();
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json({ error: "Invalid webhook payload." }, 400);
    }
    payload = parsed as DiditWebhookPayload;
  } catch {
    return json({ error: "Invalid webhook payload." }, 400);
  }

  try {
    if (!verifyDiditWebhook(rawBody, request.headers, payload)) {
      return json({ error: "Invalid webhook signature." }, 401);
    }
  } catch (cause) {
    console.error("[api/kyc/didit-webhook] Signature configuration error:", cause);
    return json({ error: "Webhook receiver is not configured." }, 503);
  }

  if (payload.webhook_type !== "status.updated" || typeof payload.session_id !== "string") {
    return json({ received: true, processed: false });
  }

  const decision = diditDecision(payload.status);

  try {
    const supabase = createServerSupabaseClient();
    const { data: submission, error: lookupError } = await supabase
      .from("kyc_submissions")
      .select("id,user_id,status")
      .eq("provider", "didit")
      .eq("provider_job_id", payload.session_id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    // Sandbox's dashboard test can send a sample session not created by ZENO.
    if (!submission) return json({ received: true, processed: false });

    const eventId = typeof payload.event_id === "string" && payload.event_id
      ? payload.event_id
      : `${payload.session_id}:${payload.webhook_type}:${payload.status}`;
    const eventFingerprint = createHash("sha256")
      .update(eventId)
      .digest("hex");
    const resultCode = typeof payload.status === "string" ? payload.status : "unknown";

    const { error: eventError } = await supabase.from("kyc_provider_events").upsert(
      {
        submission_id: submission.id,
        event_fingerprint: eventFingerprint,
        result_code: resultCode,
        signature_verified: true,
      },
      { onConflict: "submission_id,event_fingerprint", ignoreDuplicates: true },
    );
    if (eventError) throw eventError;

    let effectiveStatus = submission.status;
    if (decision && submission.status === "pending") {
      const { error: updateError } = await supabase
        .from("kyc_submissions")
        .update({ status: decision, result_code: resultCode })
        .eq("id", submission.id)
        .eq("status", "pending");
      if (updateError) throw updateError;

      const { data: latestSubmission, error: latestError } = await supabase
        .from("kyc_submissions")
        .select("status")
        .eq("id", submission.id)
        .single();
      if (latestError) throw latestError;
      effectiveStatus = latestSubmission.status;
    }

    if (effectiveStatus === "verified" || effectiveStatus === "rejected" || effectiveStatus === "failed") {
      const clerkSecret = process.env.CLERK_SECRET_KEY?.trim();
      if (!clerkSecret) throw new Error("Missing required environment variable: CLERK_SECRET_KEY");
      const clerk = createClerkClient({ secretKey: clerkSecret });
      await clerk.users.updateUserMetadata(submission.user_id, {
        publicMetadata: { kycStatus: effectiveStatus },
      });
    }

    return json({ received: true, processed: true });
  } catch (cause) {
    console.error("[api/kyc/didit-webhook] Event processing failed:", cause);
    return json({ error: "Could not process the verification event." }, 500);
  }
}
