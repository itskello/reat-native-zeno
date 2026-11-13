import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  checkPaydunyaDisbursement,
  confirmPaydunyaInvoice,
  getPaydunyaConfig,
  parsePaydunyaCallback,
  sha256Hex,
  verifyPaydunyaHash,
} from "../_shared/paydunya.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const config = getPaydunyaConfig();
  if (!config) return new Response("Sandbox is not configured", { status: 503 });

  const rawBody = await request.text();
  if (rawBody.length > 64_000) return new Response("Payload too large", { status: 413 });
  const payloadHash = await sha256Hex(rawBody);
  const callback = parsePaydunyaCallback(rawBody);
  const invoice = asRecord(callback.invoice);
  const invoiceToken = stringValue(invoice?.token) ?? stringValue(callback.disburse_token) ?? stringValue(callback.token);
  if (!invoiceToken || !await verifyPaydunyaHash(config, callback.hash)) {
    return new Response("Invalid PayDunya callback", { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseKey = getSupabaseAdminKey();
  if (!supabaseUrl || !supabaseKey) return new Response("Webhook is not configured", { status: 503 });
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });

  const { data: operation, error: operationError } = await supabase.from("mobile_money_operations")
    .select("id, reference, direction, status, source_amount_xof, source_amount_minor, source_currency, provider_operation_id, user_id")
    .eq("provider_id", "paydunya").eq("provider_operation_id", invoiceToken).maybeSingle();
  if (operationError) return new Response("Could not load deposit", { status: 503 });
  if (!operation) return new Response("Deposit not found", { status: 404 });

  let verified: Awaited<ReturnType<typeof confirmPaydunyaInvoice>>;
  try {
    verified = operation.direction === "withdrawal"
      ? await checkPaydunyaDisbursement(config, invoiceToken)
      : await confirmPaydunyaInvoice(config, invoiceToken);
  } catch {
    return new Response("Could not confirm transaction with PayDunya", { status: 503 });
  }
  const verifiedInvoice = asRecord(verified.invoice);
  const amount = Number(operation.direction === "withdrawal" ? verified.amount : verifiedInvoice?.total_amount);
  const verifiedToken = stringValue(verifiedInvoice?.token) ?? stringValue(verified.token) ?? invoiceToken;
  if (verified.response_code !== "00" || verifiedToken !== invoiceToken ||
      !await verifyPaydunyaHash(config, verified.hash) ||
      !Number.isSafeInteger(amount) || amount !== Number(operation.source_amount_minor ?? operation.source_amount_xof)) {
    return new Response("PayDunya transaction confirmation did not match", { status: 422 });
  }

  const providerStatus = (verified.status ?? stringValue(callback.status) ?? "").toLowerCase();
  const eventId = `${invoiceToken}:${providerStatus || "unknown"}`;
  const { error: eventError } = await supabase.from("mobile_money_webhook_events").upsert({
    provider_id: "paydunya",
    provider_event_id: eventId,
    operation_id: operation.id,
    event_type: `invoice.${providerStatus || "unknown"}`,
    payload_sha256: payloadHash,
    signature_verified: true,
  }, { onConflict: "provider_id,provider_event_id" });
  if (eventError) return new Response("Could not record event", { status: 503 });

  if (operation.direction === "withdrawal" && providerStatus === "success") {
    const { error: settlementError } = await supabase.rpc("settle_mobile_money_local_withdrawal", {
      p_operation_id: operation.id,
      p_provider_operation_id: invoiceToken,
      p_confirmed_amount_minor: amount,
      p_confirmed_currency: operation.source_currency ?? "XOF",
    });
    if (settlementError) {
      await markEvent(supabase, eventId, "failed");
      console.error("[paydunya-webhook] Withdrawal settlement failed.", settlementError);
      return new Response("Could not settle confirmed withdrawal", { status: 503 });
    }
    await markEvent(supabase, eventId, "processed");
    return new Response("OK", { status: 200 });
  }

  if (operation.direction === "withdrawal" && providerStatus === "failed") {
    const { error: refundError } = await supabase.rpc("fail_mobile_money_withdrawal", {
      p_operation_id: operation.id,
      p_provider_operation_id: invoiceToken,
      p_failure_code: "provider_failed",
    });
    if (refundError) {
      await markEvent(supabase, eventId, "failed");
      console.error("[paydunya-webhook] Withdrawal refund failed.", refundError);
      return new Response("Could not refund failed withdrawal", { status: 503 });
    }
    await markEvent(supabase, eventId, "processed");
    return new Response("OK", { status: 200 });
  }

  if (operation.direction === "withdrawal" && (providerStatus === "cancelled" || providerStatus === "canceled")) {
    const { error: refundError } = await supabase.rpc("fail_mobile_money_withdrawal", {
      p_operation_id: operation.id,
      p_provider_operation_id: invoiceToken,
      p_failure_code: "provider_cancelled",
    });
    if (refundError) {
      await markEvent(supabase, eventId, "failed");
      console.error("[paydunya-webhook] Withdrawal refund failed.", refundError);
      return new Response("Could not refund canceled withdrawal", { status: 503 });
    }
    await markEvent(supabase, eventId, "processed");
    return new Response("OK", { status: 200 });
  }

  if (operation.direction === "deposit" && (providerStatus === "completed" || providerStatus === "success")) {
    const { error: settlementError } = await supabase.rpc("settle_mobile_money_local_deposit", {
      p_operation_id: operation.id,
      p_provider_operation_id: invoiceToken,
      p_confirmed_amount_minor: amount,
      p_confirmed_currency: operation.source_currency ?? "XOF",
    });
    if (settlementError) {
      await markEvent(supabase, eventId, "failed");
      console.error("[paydunya-webhook] Deposit settlement failed.", settlementError);
      return new Response("Could not settle confirmed deposit", { status: 503 });
    }
    await markEvent(supabase, eventId, "processed");
    return new Response("OK", { status: 200 });
  }

  if (providerStatus === "failed" || providerStatus === "cancelled" || providerStatus === "canceled") {
    if (operation.status !== "succeeded") {
      await supabase.from("mobile_money_operations").update({
        status: "failed",
        failure_code: providerStatus,
        failure_message: "PayDunya payment was not completed.",
      }).eq("id", operation.id).in("status", ["created", "awaiting_authorization", "processing"]);
    }
    await markEvent(supabase, eventId, "processed");
    return new Response("OK", { status: 200 });
  }

  await markEvent(supabase, eventId, "ignored");
  return new Response("Pending", { status: 200 });
});

async function markEvent(supabase: ReturnType<typeof createClient>, eventId: string, status: "processed" | "ignored" | "failed") {
  await supabase.from("mobile_money_webhook_events").update({
    processing_status: status,
    processed_at: new Date().toISOString(),
  }).eq("provider_id", "paydunya").eq("provider_event_id", eventId);
}

function getSupabaseAdminKey() {
  const keyMap = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keyMap) {
    try {
      const parsed = JSON.parse(keyMap) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      console.error("[paydunya-webhook] Supabase secret key map is invalid.");
      return null;
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function stringValue(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized.length > 0 ? normalized : null;
}
