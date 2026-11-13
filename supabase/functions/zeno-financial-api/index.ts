import { createClerkClient, verifyToken } from "npm:@clerk/backend@3.26.4";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  checkPaydunyaDisbursement,
  createPaydunyaInvoice,
  createPaydunyaDisbursement,
  getPaydunyaConfig,
  paydunyaChannel,
  sha256Hex,
  submitPaydunyaDisbursement,
} from "../_shared/paydunya.ts";
import { readMobileMoneyRecipient } from "../_shared/mobile-money-validation.ts";
import {
  createPawaPayDeposit as initiatePawaPayDeposit,
  createPawaPayPayout as initiatePawaPayPayout,
  getPawaPayActiveConfiguration,
  getPawaPayConfig,
  getPawaPayOperationStatus,
  PawaPayApiError,
} from "../_shared/pawapay.ts";
import {
  getMobileMoneyRoute,
  minorToProviderAmount,
  normalizeLocalPhone,
  parseMobileMoneyMarket,
  resolvePawaPayProvider,
} from "../_shared/mobile-money-markets.ts";

const CONTACTS_KEY = "zenoContactIds";
const MAX_CONTACTS = 100;
const MAX_RESULTS = 20;
const PIN_HASH_ITERATIONS = 310_000;
const encoder = new TextEncoder();
const buckets = new Map<string, { count: number; resetAt: number }>();

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, x-client-info, content-type, x-zeno-route",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
};

type AuthContext = {
  userId: string;
  clerk: ReturnType<typeof createClerkClient>;
  supabase: SupabaseClient;
};

type Currency = "USD" | "EUR" | "XOF" | "GHS" | "NGN" | "XAF" | "CDF";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const route = request.headers.get("x-zeno-route") ?? "";
  const auth = await authenticate(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    if (route === "/api/wallet/bootstrap" && request.method === "POST") return await bootstrap(auth);
    if (route === "/api/recipients" && request.method === "GET") return await listRecipients(auth);
    if (route === "/api/recipients" && request.method === "POST") return await saveRecipient(request, auth);
    if (route.startsWith("/api/recipients?") && request.method === "DELETE") return await removeRecipient(route, auth);
    if (route.startsWith("/api/recipients/search?") && request.method === "GET") return await searchRecipients(route, auth);
    if (route === "/api/security/pin" && request.method === "POST") return await enrollPin(request, auth);
    if (route === "/api/transfers/zeno" && request.method === "POST") return await transferZeno(request, auth);
    if (route === "/api/deposits/mobile-money" && request.method === "POST") return await createPaydunyaDeposit(request, auth);
    if (route.startsWith("/api/deposits/mobile-money?") && request.method === "GET") return await readPaydunyaDeposit(route, auth);
    if (route === "/api/withdrawals" && request.method === "POST") return await createPaydunyaWithdrawal(request, auth);
    if (route.startsWith("/api/withdrawals?") && request.method === "GET") return await readPaydunyaWithdrawal(route, auth);
    return json({ error: "Route not found." }, 404);
  } catch (cause) {
    console.error("[zeno-financial-api] Request failed:", cause);
    return json({ error: "Le service financier est temporairement indisponible." }, 503);
  }
});

async function authenticate(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { ok: false as const, status: 401, error: "Connecte-toi pour continuer." };
  }

  const clerkSecret = Deno.env.get("CLERK_SECRET_KEY")?.trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseKey = getSupabaseAdminKey();
  if (!clerkSecret || !supabaseUrl || !supabaseKey) {
    console.error("[zeno-financial-api] Required server credentials are missing.");
    return { ok: false as const, status: 503, error: "Le service financier n’est pas configuré." };
  }

  try {
    const claims = await verifyToken(token, { secretKey: clerkSecret });
    if (typeof claims.sub !== "string" || !claims.sub || typeof claims.sid !== "string" || !claims.sid) {
      return { ok: false as const, status: 401, error: "Session invalide. Reconnecte-toi puis réessaie." };
    }
    return {
      ok: true as const,
      userId: claims.sub,
      clerk: createClerkClient({ secretKey: clerkSecret }),
      supabase: createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      }),
    };
  } catch {
    return { ok: false as const, status: 401, error: "Session invalide. Reconnecte-toi puis réessaie." };
  }
}

async function createPaydunyaDeposit(request: Request, auth: AuthContext) {
  const limit = rateLimit(`mobile-money:deposit:${auth.userId}`, 8, 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de dépôts. Réessaie dans un instant.");
  const body = await readBody(request) as {
    countryId?: unknown; providerId?: unknown; phoneNumber?: unknown;
    amountXof?: unknown; walletCurrency?: unknown; idempotencyKey?: unknown;
  } | null;
  const countryId = body?.countryId;
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  const amountXof = body?.amountXof;

  const marketId = parseMobileMoneyMarket(countryId);
  const marketRoute = marketId ? getMobileMoneyRoute(marketId, providerId) : null;
  if (!marketId || !marketRoute) return json({ error: "Choisis un pays et un réseau Mobile Money pris en charge." }, 400);
  if (marketRoute.provider === "pawapay") {
    return await createPawaPayDepositRequest({
      auth,
      marketId,
      operatorId: providerId,
      phoneNumber,
      amountMinor: typeof body?.amountMinor === "number" ? body.amountMinor : amountXof,
      walletCurrency: body?.walletCurrency,
      idempotencyKey,
    });
  }

  const config = getPaydunyaConfig();
  if (!config) return json({ error: "Le sandbox PayDunya n’est pas encore configuré sur le serveur." }, 503);

  const channel = paydunyaChannel(countryId, providerId);
  if (!channel) return json({ error: "Ce réseau Mobile Money n’est pas encore disponible dans le sandbox PayDunya." }, 400);
  const marketCurrency = marketRoute.market.currency;
  if (body?.walletCurrency !== marketCurrency) {
    return json({ error: `Choisis le portefeuille local ${marketCurrency} de ce pays. La conversion vers USD n’est pas activée.` }, 400);
  }
  const requestedAmountMinor = typeof body?.amountMinor === "number" ? body.amountMinor : amountXof;
  if (typeof requestedAmountMinor !== "number" || !Number.isSafeInteger(requestedAmountMinor) || requestedAmountMinor <= 0) {
    return json({ error: `Saisis un montant ${marketCurrency} valide.` }, 400);
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) return json({ error: "La référence du dépôt est invalide." }, 400);
  const normalizedPhone = normalizeLocalPhone(marketId, phoneNumber);
  if (!normalizedPhone) {
    return json({ error: "Saisis un numéro Mobile Money valide pour le pays choisi." }, 400);
  }
  const nationalPhone = normalizedPhone.national;

  const requestFingerprint = await sha256Hex(JSON.stringify({ countryId, providerId, nationalPhone, amount: requestedAmountMinor, walletCurrency: marketCurrency }));
  const { data: existing, error: existingError } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, provider_operation_id, status, request_fingerprint, source_amount_xof, source_amount_minor, source_currency, created_at")
    .eq("user_id", auth.userId).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint) return json({ error: "Cette référence est déjà utilisée pour un autre dépôt." }, 409);
    if (existing.status === "failed" || existing.status === "expired") return json({ error: "Ce dépôt a échoué. Crée une nouvelle demande depuis l’application." }, 409);
    if (!existing.provider_operation_id) return json({ error: "Le dépôt est en cours d’initialisation. Consulte l’historique avant de réessayer." }, 409);
    return json({ deposit: paydunyaDepositReceipt(existing, countryId, providerId, nationalPhone) }, 200);
  }

  const operationId = crypto.randomUUID();
  const reference = `ZPD-${operationId.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
  const { error: insertError } = await auth.supabase.from("mobile_money_operations").insert({
    id: operationId,
    user_id: auth.userId,
    idempotency_key: idempotencyKey,
    direction: "deposit",
    status: "created",
    country_id: countryId,
    provider_id: "paydunya",
    reference,
    phone_number: normalizedPhone.e164,
    source_amount_xof: requestedAmountMinor,
    source_currency: marketCurrency,
    source_amount_minor: requestedAmountMinor,
    wallet_currency: marketCurrency,
    wallet_amount_minor: requestedAmountMinor,
    exchange_rate: 1,
    zeno_fee_minor: 0,
    request_fingerprint: requestFingerprint,
  });
  if (insertError?.code === "23505") return json({ error: "Cette demande a déjà été créée. Vérifie l’historique du portefeuille." }, 409);
  if (insertError) throw insertError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  if (!supabaseUrl) throw new Error("Supabase URL is not configured.");
  const callbackUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/paydunya-webhook`;
  try {
    const providerResponse = await createPaydunyaInvoice(config, {
      amountXof: requestedAmountMinor,
      description: `Dépôt ZENO ${reference}`,
      channel,
      reference,
      operationId,
      callbackUrl,
      returnUrl: "zeno://",
    });
    const invoiceToken = typeof providerResponse.token === "string" ? providerResponse.token : "";
    const checkoutUrl = typeof providerResponse.response_text === "string" ? providerResponse.response_text : "";
    const parsedCheckoutUrl = checkoutUrl ? new URL(checkoutUrl) : null;
    if (providerResponse.response_code !== "00" || !/^[A-Za-z0-9_-]{4,160}$/.test(invoiceToken) ||
        parsedCheckoutUrl?.protocol !== "https:" || parsedCheckoutUrl.hostname !== "app.paydunya.com" ||
        !parsedCheckoutUrl.pathname.startsWith("/sandbox-checkout/invoice/")) {
      throw new Error("PayDunya returned an invalid sandbox checkout response.");
    }
    const { error: updateError } = await auth.supabase.from("mobile_money_operations").update({
      provider_operation_id: invoiceToken,
      status: "awaiting_authorization",
    }).eq("id", operationId).eq("status", "created");
    if (updateError) throw updateError;
    return json({ deposit: {
      id: operationId,
      reference,
      status: "pending",
      amountXof: minorToDisplayAmount(requestedAmountMinor, marketCurrency),
      walletAmount: minorToDisplayAmount(requestedAmountMinor, marketCurrency),
      walletCurrency: marketCurrency,
      fee: 0,
      totalAmount: minorToDisplayAmount(requestedAmountMinor, marketCurrency),
      exchangeRate: "1",
      createdAt: new Date().toISOString(),
      phoneNumber: normalizedPhone.e164,
      countryId,
      providerName: marketRoute.name,
      checkoutUrl,
    } });
  } catch (cause) {
    await auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "provider_unavailable", failure_message: "PayDunya sandbox request failed." })
      .eq("id", operationId).eq("status", "created");
    console.error("[zeno-financial-api] PayDunya sandbox deposit initialization failed.", cause);
    return json({ error: "Impossible de démarrer le paiement PayDunya. Vérifie la configuration du sandbox puis réessaie." }, 502);
  }
}

async function createPawaPayDepositRequest(input: {
  auth: AuthContext;
  marketId: NonNullable<ReturnType<typeof parseMobileMoneyMarket>>;
  operatorId: string;
  phoneNumber: string;
  amountMinor: unknown;
  walletCurrency: unknown;
  idempotencyKey: string;
}) {
  const limit = rateLimit(`mobile-money:deposit:${input.auth.userId}`, 8, 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de dépôts. Réessaie dans un instant.");
  const marketRoute = getMobileMoneyRoute(input.marketId, input.operatorId);
  const config = getPawaPayConfig();
  if (!marketRoute || marketRoute.provider !== "pawapay" || !config) {
    return json({ error: "Le paiement Mobile Money n’est pas encore activé pour ce pays et ce réseau." }, 503);
  }
  const market = marketRoute.market;
  if (input.walletCurrency !== market.currency) {
    return json({ error: `Choisis le portefeuille ${market.currency} de ce pays. La conversion vers USD n’est pas activée.` }, 400);
  }
  if (typeof input.amountMinor !== "number" || !Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
    return json({ error: `Saisis un montant ${market.currency} valide.` }, 400);
  }
  const phone = normalizeLocalPhone(input.marketId, input.phoneNumber);
  if (!phone) return json({ error: "Saisis un numéro Mobile Money valide pour ce pays." }, 400);
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey)) {
    return json({ error: "La référence du dépôt est invalide." }, 400);
  }

  const requestFingerprint = await sha256Hex(JSON.stringify({
    countryId: input.marketId, providerId: input.operatorId, phone: phone.e164,
    amountMinor: input.amountMinor, currency: market.currency,
  }));
  const { data: existing, error: existingError } = await input.auth.supabase.from("mobile_money_operations")
    .select("id, reference, provider_operation_id, status, request_fingerprint, source_amount_xof, source_currency, source_amount_minor, created_at")
    .eq("user_id", input.auth.userId).eq("idempotency_key", input.idempotencyKey).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint) return json({ error: "Cette référence est déjà utilisée pour un autre dépôt." }, 409);
    if (!existing.provider_operation_id) return json({ error: "Le dépôt est en cours d’initialisation. Consulte l’historique avant de réessayer." }, 409);
    return json({ deposit: {
      id: existing.id, reference: existing.reference,
      status: existing.status === "succeeded" ? "completed" : existing.status === "failed" ? "failed" : "pending",
      amountXof: minorToDisplayAmount(Number(existing.source_amount_minor), existing.source_currency), sourceCurrency: existing.source_currency,
      walletAmount: minorToDisplayAmount(Number(existing.source_amount_minor), existing.source_currency), walletCurrency: existing.source_currency,
      fee: 0, totalAmount: minorToDisplayAmount(Number(existing.source_amount_minor), existing.source_currency), createdAt: existing.created_at,
      phoneNumber: phone.e164, countryId: input.marketId, providerName: marketRoute.name,
      paymentMethod: "pawapay",
    } });
  }

  const operationId = crypto.randomUUID();
  const reference = `ZPD-${operationId.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
  const { error: insertError } = await input.auth.supabase.from("mobile_money_operations").insert({
    id: operationId, user_id: input.auth.userId, idempotency_key: input.idempotencyKey,
    direction: "deposit", status: "created", country_id: input.marketId,
    provider_id: "pawapay", provider_operation_id: operationId, reference,
    phone_number: phone.e164, source_amount_xof: input.amountMinor,
    source_currency: market.currency, source_amount_minor: input.amountMinor,
    wallet_currency: market.currency, wallet_amount_minor: input.amountMinor,
    exchange_rate: 1, zeno_fee_minor: 0, request_fingerprint: requestFingerprint,
  });
  if (insertError?.code === "23505") return json({ error: "Cette demande a déjà été créée. Vérifie l’historique avant de réessayer." }, 409);
  if (insertError) throw insertError;

  try {
    const activeConfiguration = await getPawaPayActiveConfiguration(config);
    const correspondent = resolvePawaPayProvider(activeConfiguration, input.marketId, input.operatorId, "DEPOSIT");
    if (!correspondent) {
      await input.auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "market_not_active", failure_message: "The requested market, operator or deposit flow is not active in the pawaPay merchant configuration." }).eq("id", operationId).eq("status", "created");
      return json({ error: "Ce réseau ou ce type d’opération n’est pas encore activé dans le compte pawaPay." }, 503);
    }
    await initiatePawaPayDeposit(config, {
      id: operationId,
      amount: minorToProviderAmount(input.amountMinor, market.currency),
      currency: market.currency,
      provider: correspondent.provider,
      phoneNumber: phone.e164,
      clientReferenceId: reference,
      customerMessage: "ZENO wallet deposit",
    });
    const { error: updateError } = await input.auth.supabase.from("mobile_money_operations")
      .update({ status: "awaiting_authorization" }).eq("id", operationId).eq("status", "created");
    if (updateError) throw updateError;
    return json({ deposit: {
      id: operationId, reference, status: "pending",
      amountXof: minorToDisplayAmount(input.amountMinor as number, market.currency), sourceCurrency: market.currency,
      walletAmount: minorToDisplayAmount(input.amountMinor as number, market.currency), walletCurrency: market.currency,
      fee: 0, totalAmount: minorToDisplayAmount(input.amountMinor as number, market.currency), exchangeRate: "1",
      createdAt: new Date().toISOString(), phoneNumber: phone.e164,
      countryId: input.marketId, providerName: marketRoute.name,
      paymentMethod: "pawapay",
    } }, 202);
  } catch (cause) {
    if (cause instanceof PawaPayApiError && cause.httpStatus >= 400 && cause.httpStatus < 500 && cause.httpStatus !== 409) {
      await input.auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "provider_rejected", failure_message: "pawaPay rejected the deposit request." }).eq("id", operationId).eq("status", "created");
      return json({ error: "pawaPay a refusé cette demande. Vérifie le numéro et le réseau, puis réessaie." }, 502);
    }
    console.error("[zeno-financial-api] pawaPay deposit initiation failed.", cause);
    // Network failures can happen after pawaPay accepted a request. Keep the
    // operation pending for status reconciliation; never automatically retry.
    return json({ error: "La demande a été envoyée mais sa confirmation prend du temps. Consulte l’historique avant de réessayer." }, 202);
  }
}

async function readPaydunyaDeposit(route: string, auth: AuthContext) {
  const reference = new URLSearchParams(route.split("?", 2)[1]).get("reference")?.trim() ?? "";
  if (!/^ZPD-[A-Z0-9]{20}$/.test(reference)) return json({ error: "Référence de dépôt invalide." }, 400);
  const { data, error } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, status, source_amount_xof, source_amount_minor, source_currency, wallet_amount_minor, wallet_currency, created_at, phone_number, country_id, provider_id, provider_operation_id")
    .eq("user_id", auth.userId).eq("reference", reference).maybeSingle();
  if (error) throw error;
  if (!data) return json({ error: "Dépôt introuvable." }, 404);
  if (data.provider_id === "pawapay" && data.status !== "succeeded" && data.status !== "failed" && data.status !== "expired") {
    await reconcilePawaPayOperation(auth.supabase, data, "deposit");
    const { data: latest, error: latestError } = await auth.supabase.from("mobile_money_operations")
      .select("id, reference, status, source_amount_xof, source_amount_minor, source_currency, wallet_amount_minor, wallet_currency, created_at, phone_number, country_id, provider_id")
      .eq("id", data.id).single();
    if (latestError) throw latestError;
    Object.assign(data, latest);
  }
  return json({ deposit: {
    id: data.id,
    reference: data.reference,
    status: data.status === "succeeded" ? "completed" : data.status === "failed" || data.status === "expired" ? "failed" : "pending",
    amountXof: minorToDisplayAmount(Number(data.source_amount_minor ?? data.source_amount_xof), data.source_currency ?? "XOF"),
    walletAmount: Number(data.wallet_amount_minor),
    walletCurrency: data.wallet_currency,
    fee: 0,
    totalAmount: Number(data.source_amount_xof),
    createdAt: data.created_at,
    phoneNumber: data.phone_number,
    countryId: data.country_id,
    providerName: data.provider_id === "paydunya" ? "PayDunya Mobile Money" : data.provider_id,
  } });
}

async function reconcilePawaPayOperation(
  supabase: SupabaseClient,
  operation: { id: string; provider_operation_id?: string | null; direction: string; source_amount_minor: number; source_currency: string; status: string },
  direction: "deposit" | "withdrawal",
) {
  if (!operation.provider_operation_id || operation.direction !== direction) return;
  const config = getPawaPayConfig();
  if (!config) return;
  try {
    const providerStatus = await getPawaPayOperationStatus(config, direction === "deposit" ? "deposit" : "payout", operation.provider_operation_id);
    if (providerStatus.status !== "FOUND" || !providerStatus.operationStatus) return;
    if (providerStatus.operationStatus === "FAILED") {
      if (direction === "deposit") {
        await supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "provider_failed", failure_message: "Mobile Money provider did not complete the deposit." })
          .eq("id", operation.id).in("status", ["created", "awaiting_authorization", "processing"]);
      } else {
        await supabase.rpc("fail_mobile_money_local_withdrawal", {
          p_operation_id: operation.id, p_provider_operation_id: operation.provider_operation_id, p_failure_code: "provider_failed",
        });
      }
      return;
    }
    if (providerStatus.operationStatus !== "COMPLETED") return;
    const expectedAmount = minorToProviderAmount(operation.source_amount_minor, operation.source_currency as "XOF" | "GHS" | "NGN" | "XAF" | "CDF");
    if (providerStatus.currency !== operation.source_currency || providerStatus.amount !== expectedAmount) {
      console.error("[zeno-financial-api] pawaPay completed amount/currency did not match the stored operation.", operation.id);
      return;
    }
    if (direction === "deposit") {
      await supabase.rpc("settle_mobile_money_local_deposit", {
        p_operation_id: operation.id, p_provider_operation_id: operation.provider_operation_id,
        p_confirmed_amount_minor: operation.source_amount_minor, p_confirmed_currency: operation.source_currency,
      });
    } else {
      await supabase.rpc("settle_mobile_money_local_withdrawal", {
        p_operation_id: operation.id, p_provider_operation_id: operation.provider_operation_id,
        p_confirmed_amount_minor: operation.source_amount_minor, p_confirmed_currency: operation.source_currency,
      });
    }
  } catch (cause) {
    // Status reads are best effort; a transient provider outage must not change a financial state.
    console.error("[zeno-financial-api] pawaPay status reconciliation failed.", cause);
  }
}

function paydunyaDepositReceipt(
  operation: { id: string; reference: string; provider_operation_id: string; status: string; source_amount_xof: number; source_amount_minor?: number; source_currency?: string; created_at: string },
  countryId: string,
  providerId: string,
  phoneNumber: string,
) {
  const sourceCurrency = operation.source_currency ?? "XOF";
  const amountXof = minorToDisplayAmount(Number(operation.source_amount_minor ?? operation.source_amount_xof), sourceCurrency);
  const checkoutBase = "https://app.paydunya.com/sandbox-checkout/invoice/";
  return {
    id: operation.id,
    reference: operation.reference,
    status: operation.status === "succeeded" ? "completed" : operation.status === "failed" || operation.status === "expired" ? "failed" : "pending",
    amountXof,
    walletAmount: amountXof,
    walletCurrency: sourceCurrency,
    fee: 0,
    totalAmount: amountXof,
    exchangeRate: "1",
    createdAt: operation.created_at,
    phoneNumber,
    countryId,
    providerName: providerId === "mtn" ? "MTN Money" : providerId === "moov" ? "Moov Money" : providerId === "celtiis" ? "Celtiis" : "Orange Money",
    checkoutUrl: `${checkoutBase}${encodeURIComponent(operation.provider_operation_id)}`,
  };
}

function minorToDisplayAmount(amountMinor: number, currency: string) {
  return ["GHS", "NGN", "CDF"].includes(currency) ? amountMinor / 100 : amountMinor;
}

async function createPaydunyaWithdrawal(request: Request, auth: AuthContext) {
  const limit = rateLimit(`mobile-money:withdrawal:${auth.userId}`, 8, 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de retraits. Réessaie dans un instant.");
  const body = await readBody(request) as {
    countryId?: unknown; providerId?: unknown; phoneNumber?: unknown; recipientName?: unknown;
    amount?: unknown; currency?: unknown; pin?: unknown; idempotencyKey?: unknown;
  } | null;
  const marketId = parseMobileMoneyMarket(body?.countryId);
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";
  const marketRoute = marketId ? getMobileMoneyRoute(marketId, providerId) : null;
  if (marketId && marketRoute?.provider === "pawapay") {
    return await createPawaPayWithdrawalRequest({ auth, body, marketId, providerId });
  }
  const config = getPaydunyaConfig();
  if (!config) return json({ error: "Le sandbox PayDunya n’est pas configuré sur le serveur." }, 503);
  if (!config.privateKey.startsWith("test_")) {
    return json({ error: "Le décaissement est bloqué : seules les clés de test PayDunya sont autorisées." }, 503);
  }
  const recipient = readMobileMoneyRecipient(body);
  if (!recipient.ok) return json({ error: recipient.error }, 400);
  if (body?.currency !== recipient.data.currency) return json({ error: `Le retrait doit utiliser le portefeuille local ${recipient.data.currency}.` }, 400);
  const amountMinor = typeof body.amount === "number" && Number.isSafeInteger(body.amount) && body.amount > 0
    ? body.amount
    : null;
  if (amountMinor === null) return json({ error: `Saisis un montant ${recipient.data.currency} valide.` }, 400);
  const recipientName = typeof body.recipientName === "string" ? body.recipientName.trim() : "";
  if (recipientName.length < 2 || recipientName.length > 120) return json({ error: "Saisis un nom de bénéficiaire valide." }, 400);
  const mode = paydunyaDisbursementMode(recipient.data.countryId, recipient.data.providerId);
  if (!mode) return json({ error: "Ce réseau n’est pas disponible pour le décaissement PayDunya." }, 400);
  const pin = typeof body.pin === "string" ? body.pin : "";
  if (!/^\d{6}$/.test(pin)) return json({ error: "Saisis ton code PIN de transaction à 6 chiffres." }, 400);

  const { data: pinRecord, error: pinError } = await auth.supabase.from("user_security_pins")
    .select("salt, pin_hash, failed_attempts, locked_until").eq("user_id", auth.userId).maybeSingle();
  if (pinError) throw pinError;
  if (!pinRecord) return json({ error: "Configure ton code PIN avant d’effectuer un retrait." }, 428);
  if (pinRecord.locked_until && new Date(pinRecord.locked_until).getTime() > Date.now()) {
    return json({ error: "Le code PIN est temporairement verrouillé. Réessaie plus tard." }, 423);
  }
  if (!await verifyPin(pin, pinRecord.salt, pinRecord.pin_hash)) {
    await auth.supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
    return json({ error: "Code PIN incorrect." }, 401);
  }
  await auth.supabase.rpc("reset_pin_failures", { p_user_id: auth.userId });

  const requestFingerprint = await sha256Hex(JSON.stringify({
    countryId: recipient.data.countryId,
    providerId: recipient.data.providerId,
    phoneNumber: recipient.data.phoneNumber,
    recipientName,
    amountMinor,
    currency: recipient.data.currency,
  }));
  const { data: existing, error: existingError } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, provider_operation_id, status, request_fingerprint, source_amount_xof, created_at, phone_number, country_id")
    .eq("user_id", auth.userId).eq("idempotency_key", recipient.data.idempotencyKey).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.request_fingerprint !== requestFingerprint) return json({ error: "Cette référence a déjà été utilisée pour un autre retrait." }, 409);
    return json({ withdrawal: paydunyaWithdrawalReceipt(existing, recipientName, recipient.data.providerName) }, 200);
  }

  const operationId = crypto.randomUUID();
  const reference = `ZPW-${operationId.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
  const { error: insertError } = await auth.supabase.from("mobile_money_operations").insert({
    id: operationId,
    user_id: auth.userId,
    idempotency_key: recipient.data.idempotencyKey,
    direction: "withdrawal",
    status: "created",
    country_id: recipient.data.countryId,
    provider_id: "paydunya",
    reference,
    phone_number: recipient.data.e164,
    contact_name: recipientName,
    source_amount_xof: amountMinor,
    source_currency: recipient.data.currency,
    source_amount_minor: amountMinor,
    wallet_currency: recipient.data.currency,
    wallet_amount_minor: amountMinor,
    exchange_rate: 1,
    zeno_fee_minor: 0,
    request_fingerprint: requestFingerprint,
  });
  if (insertError?.code === "23505") return json({ error: "Cette demande existe déjà. Vérifie l’historique avant de réessayer." }, 409);
  if (insertError) throw insertError;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  if (!supabaseUrl) throw new Error("Supabase URL is not configured.");
  const callbackUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/paydunya-webhook`;
  let disburseToken = "";
  try {
    const created = await createPaydunyaDisbursement(config, {
      phoneNumber: recipient.data.phoneNumber,
      amountXof: amountMinor,
      withdrawMode: mode,
      callbackUrl,
    });
    disburseToken = typeof created.disburse_token === "string" ? created.disburse_token.trim() : "";
    if (created.response_code !== "00" || !/^[A-Za-z0-9_-]{4,160}$/.test(disburseToken)) {
      throw new Error("PayDunya did not create a payout token.");
    }
  } catch (cause) {
    await auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "provider_unavailable", failure_message: "PayDunya test disbursement could not be initialized." }).eq("id", operationId).eq("status", "created");
    console.error("[zeno-financial-api] PayDunya test payout initialization failed.", cause);
    return json({ error: "Impossible de démarrer le décaissement sandbox PayDunya." }, 502);
  }

  const { error: tokenError } = await auth.supabase.from("mobile_money_operations").update({
    provider_operation_id: disburseToken,
    status: "awaiting_authorization",
  }).eq("id", operationId).eq("status", "created");
  if (tokenError) throw tokenError;

  const { error: reserveError } = await auth.supabase.rpc("reserve_mobile_money_local_withdrawal", {
    p_operation_id: operationId,
    p_provider_operation_id: disburseToken,
  });
  if (reserveError) {
    await auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "reservation_failed", failure_message: "Wallet funds could not be reserved." }).eq("id", operationId).eq("status", "awaiting_authorization");
    if (reserveError.message.includes("Insufficient wallet balance")) return json({ error: "Le solde XOF est insuffisant pour ce retrait." }, 422);
    console.error("[zeno-financial-api] Could not reserve wallet funds for test payout.", reserveError);
    return json({ error: "Le retrait n’a pas pu être préparé. Vérifie l’historique avant de réessayer." }, 503);
  }

  let providerResponse: Awaited<ReturnType<typeof submitPaydunyaDisbursement>>;
  try {
    providerResponse = await submitPaydunyaDisbursement(config, disburseToken, reference);
  } catch (cause) {
    // The request may have reached PayDunya; keep the wallet debit and reconcile
    // through the status endpoint instead of risking an accidental duplicate.
    console.error("[zeno-financial-api] PayDunya test payout submission is ambiguous.", cause);
    const { data: operation } = await auth.supabase.from("mobile_money_operations").select("*").eq("id", operationId).single();
    return json({ withdrawal: paydunyaWithdrawalReceipt(operation, recipientName, recipient.data.providerName) }, 202);
  }

  if (providerResponse.response_code !== "00") {
    const { error } = await auth.supabase.rpc("fail_mobile_money_local_withdrawal", {
      p_operation_id: operationId,
      p_provider_operation_id: disburseToken,
      p_failure_code: "provider_rejected",
    });
    if (error) throw error;
  } else {
    const providerStatus = (providerResponse.status ?? "").toLowerCase();
    if (providerStatus === "success") {
      await settlePaydunyaWithdrawal(auth.supabase, operationId, disburseToken);
    } else if (providerStatus === "failed") {
      const { error } = await auth.supabase.rpc("fail_mobile_money_withdrawal", {
        p_operation_id: operationId,
        p_provider_operation_id: disburseToken,
        p_failure_code: "provider_failed",
      });
      if (error) throw error;
    }
  }

  const { data: operation, error: readError } = await auth.supabase.from("mobile_money_operations").select("*").eq("id", operationId).single();
  if (readError) throw readError;
  return json({ withdrawal: paydunyaWithdrawalReceipt(operation, recipientName, recipient.data.providerName) });
}

async function createPawaPayWithdrawalRequest(input: {
  auth: AuthContext;
  body: { countryId?: unknown; providerId?: unknown; phoneNumber?: unknown; recipientName?: unknown; amount?: unknown; currency?: unknown; pin?: unknown; idempotencyKey?: unknown } | null;
  marketId: NonNullable<ReturnType<typeof parseMobileMoneyMarket>>;
  providerId: string;
}) {
  const { auth, body, marketId, providerId } = input;
  const route = getMobileMoneyRoute(marketId, providerId);
  const config = getPawaPayConfig();
  if (!route || route.provider !== "pawapay" || !config) return json({ error: "Ce corridor pawaPay n’est pas configuré." }, 503);
  const amountMinor = typeof body?.amount === "number" && Number.isSafeInteger(body.amount) && body.amount > 0 ? body.amount : null;
  if (body?.currency !== route.market.currency || amountMinor === null) return json({ error: `Saisis un montant valide en ${route.market.currency}.` }, 400);
  const phoneInput = typeof body?.phoneNumber === "string" ? body.phoneNumber : "";
  const phone = normalizeLocalPhone(marketId, phoneInput);
  if (!phone) return json({ error: "Saisis un numéro Mobile Money valide pour ce pays." }, 400);
  const recipientName = typeof body?.recipientName === "string" ? body.recipientName.trim() : "";
  if (recipientName.length < 2 || recipientName.length > 120) return json({ error: "Saisis un nom de bénéficiaire valide." }, 400);
  const pin = typeof body?.pin === "string" ? body.pin : "";
  if (!/^\d{6}$/.test(pin)) return json({ error: "Saisis ton code PIN de transaction à 6 chiffres." }, 400);
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) return json({ error: "La référence du retrait est invalide." }, 400);

  const { data: pinRecord, error: pinError } = await auth.supabase.from("user_security_pins").select("salt, pin_hash, failed_attempts, locked_until").eq("user_id", auth.userId).maybeSingle();
  if (pinError) throw pinError;
  if (!pinRecord) return json({ error: "Configure ton code PIN avant d’effectuer un retrait." }, 428);
  if (pinRecord.locked_until && new Date(pinRecord.locked_until).getTime() > Date.now()) return json({ error: "Le code PIN est temporairement verrouillé. Réessaie plus tard." }, 423);
  if (!await verifyPin(pin, pinRecord.salt, pinRecord.pin_hash)) {
    await auth.supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
    return json({ error: "Code PIN incorrect." }, 401);
  }
  await auth.supabase.rpc("reset_pin_failures", { p_user_id: auth.userId });

  const fingerprint = await sha256Hex(JSON.stringify({ marketId, providerId, phone: phone.e164, recipientName, amountMinor, currency: route.market.currency }));
  const { data: existing, error: existingError } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, status, request_fingerprint, source_amount_minor, source_currency, wallet_currency, created_at, phone_number, provider_operation_id, provider_id")
    .eq("user_id", auth.userId).eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    if (existing.request_fingerprint !== fingerprint) return json({ error: "Cette référence a déjà été utilisée pour un autre retrait." }, 409);
    if (existing.provider_id !== "pawapay") return json({ error: "Cette référence est déjà utilisée." }, 409);
    if (existing.status !== "succeeded" && existing.status !== "failed") await reconcilePawaPayOperation(auth.supabase, { ...existing, direction: "withdrawal" }, "withdrawal");
    const displayAmount = minorToDisplayAmount(Number(existing.source_amount_minor), existing.source_currency);
    return json({ withdrawal: { id: existing.id, reference: existing.reference, status: existing.status === "succeeded" ? "completed" : existing.status === "failed" ? "failed" : "pending", amount: displayAmount, currency: existing.source_currency, fee: 0, totalAmount: displayAmount, createdAt: existing.created_at, recipientName, phoneNumber: phone.national, providerName: route.name } });
  }

  const operationId = crypto.randomUUID();
  const reference = `ZPW-${operationId.replaceAll("-", "").slice(0, 20).toUpperCase()}`;
  const { error: insertError } = await auth.supabase.from("mobile_money_operations").insert({
    id: operationId, user_id: auth.userId, idempotency_key: idempotencyKey, direction: "withdrawal", status: "awaiting_authorization",
    country_id: marketId, provider_id: "pawapay", provider_operation_id: operationId, reference, phone_number: phone.e164,
    contact_name: recipientName, source_amount_xof: amountMinor, source_currency: route.market.currency, source_amount_minor: amountMinor,
    wallet_currency: route.market.currency, wallet_amount_minor: amountMinor, exchange_rate: 1, zeno_fee_minor: 0, request_fingerprint: fingerprint,
  });
  if (insertError) throw insertError;

  const { error: reserveError } = await auth.supabase.rpc("reserve_mobile_money_local_withdrawal", { p_operation_id: operationId, p_provider_operation_id: operationId });
  if (reserveError) {
    await auth.supabase.from("mobile_money_operations").update({ status: "failed", failure_code: "reservation_failed", failure_message: "Wallet funds could not be reserved." }).eq("id", operationId).eq("status", "awaiting_authorization");
    if (reserveError.message.includes("Insufficient wallet balance")) return json({ error: `Le solde ${route.market.currency} est insuffisant pour ce retrait.` }, 422);
    throw reserveError;
  }

  try {
    const activeConfiguration = await getPawaPayActiveConfiguration(config);
    const correspondent = resolvePawaPayProvider(activeConfiguration, marketId, providerId, "PAYOUT");
    if (!correspondent) {
      await auth.supabase.rpc("fail_mobile_money_local_withdrawal", { p_operation_id: operationId, p_provider_operation_id: operationId, p_failure_code: "market_not_active" });
      return json({ error: "Le retrait n’est pas activé pour ce réseau sur le compte pawaPay." }, 503);
    }
    await initiatePawaPayPayout(config, { id: operationId, amount: minorToProviderAmount(amountMinor, route.market.currency), currency: route.market.currency, provider: correspondent.provider, phoneNumber: phone.e164, clientReferenceId: reference, customerMessage: "ZENO wallet withdrawal" });
    const displayAmount = minorToDisplayAmount(amountMinor, route.market.currency);
    return json({ withdrawal: { id: operationId, reference, status: "pending", amount: displayAmount, currency: route.market.currency, fee: 0, totalAmount: displayAmount, createdAt: new Date().toISOString(), recipientName, phoneNumber: phone.national, providerName: route.name } }, 202);
  } catch (cause) {
    if (cause instanceof PawaPayApiError && cause.httpStatus >= 400 && cause.httpStatus < 500 && cause.httpStatus !== 409) {
      await auth.supabase.rpc("fail_mobile_money_local_withdrawal", { p_operation_id: operationId, p_provider_operation_id: operationId, p_failure_code: "provider_rejected" });
      return json({ error: "pawaPay a refusé le retrait; le montant a été rendu au portefeuille." }, 502);
    }
    // Request acceptance can be ambiguous; keep funds reserved until status reconciliation.
    console.error("[zeno-financial-api] pawaPay payout initiation is ambiguous.", cause);
    return json({ error: "Le retrait est en cours de vérification. Consulte l’historique avant de réessayer." }, 202);
  }
}

async function readPaydunyaWithdrawal(route: string, auth: AuthContext) {
  const reference = new URLSearchParams(route.split("?", 2)[1]).get("reference")?.trim() ?? "";
  if (!/^ZPW-[A-Z0-9]{20}$/.test(reference)) return json({ error: "Référence de retrait invalide." }, 400);
  const { data: operation, error } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, status, source_amount_xof, source_amount_minor, source_currency, wallet_currency, created_at, phone_number, country_id, contact_name, provider_operation_id, provider_id")
    .eq("user_id", auth.userId).eq("direction", "withdrawal").eq("reference", reference).maybeSingle();
  if (error) throw error;
  if (!operation) return json({ error: "Retrait introuvable." }, 404);
  if (operation.provider_id === "pawapay") {
    if (operation.status !== "succeeded" && operation.status !== "failed" && operation.status !== "expired") {
      await reconcilePawaPayOperation(auth.supabase, { ...operation, direction: "withdrawal" }, "withdrawal");
    }
    const { data: latest, error: latestError } = await auth.supabase.from("mobile_money_operations")
      .select("id, reference, status, source_amount_minor, source_currency, wallet_currency, created_at, phone_number, country_id, contact_name")
      .eq("id", operation.id).single();
    if (latestError) throw latestError;
    const displayAmount = minorToDisplayAmount(Number(latest.source_amount_minor), latest.source_currency);
    return json({ withdrawal: { id: latest.id, reference: latest.reference, status: latest.status === "succeeded" ? "completed" : latest.status === "failed" || latest.status === "expired" ? "failed" : "pending", amount: displayAmount, fee: 0, totalAmount: displayAmount, currency: latest.source_currency, createdAt: latest.created_at, recipientName: latest.contact_name ?? "", phoneNumber: latest.phone_number, providerName: "pawaPay Mobile Money" } });
  }
  const config = getPaydunyaConfig();
  if (operation.status === "processing" && config && config.privateKey.startsWith("test_") && operation.provider_operation_id) {
    try {
      const status = await checkPaydunyaDisbursement(config, operation.provider_operation_id);
      const providerStatus = (status.status ?? "").toLowerCase();
      if (status.response_code === "00" && providerStatus === "success") {
        await settlePaydunyaWithdrawal(auth.supabase, operation.id, operation.provider_operation_id);
      } else if (status.response_code === "00" && providerStatus === "failed") {
      await auth.supabase.rpc("fail_mobile_money_local_withdrawal", {
          p_operation_id: operation.id,
          p_provider_operation_id: operation.provider_operation_id,
          p_failure_code: "provider_failed",
        });
      }
    } catch (cause) {
      console.error("[zeno-financial-api] PayDunya test payout status check failed.", cause);
    }
  }
  const { data: latest, error: latestError } = await auth.supabase.from("mobile_money_operations")
    .select("id, reference, status, source_amount_xof, source_amount_minor, source_currency, wallet_currency, created_at, phone_number, country_id, contact_name, provider_id")
    .eq("id", operation.id).single();
  if (latestError) throw latestError;
  const providerName = "PayDunya Mobile Money";
  const nationalPhone = latest.phone_number.replace(/^\+?(229|225|221|226|223|228|237)/, "");
  return json({ withdrawal: paydunyaWithdrawalReceipt({ ...latest, phone_number: nationalPhone }, latest.contact_name ?? "", providerName) });
}

async function settlePaydunyaWithdrawal(supabase: SupabaseClient, operationId: string, disburseToken: string) {
  const { data: operation, error: readError } = await supabase.from("mobile_money_operations").select("source_amount_minor, source_currency").eq("id", operationId).single();
  if (readError) throw readError;
  const { error } = await supabase.rpc("settle_mobile_money_local_withdrawal", {
    p_operation_id: operationId, p_provider_operation_id: disburseToken,
    p_confirmed_amount_minor: operation.source_amount_minor, p_confirmed_currency: operation.source_currency,
  });
  if (error) throw error;
}

function paydunyaDisbursementMode(countryId: string, providerId: string) {
  const modes: Record<string, string> = {
    "benin:mtn": "mtn-benin",
    "benin:moov": "moov-benin",
    "benin:celtiis": "celtiis-cash",
    "cote-divoire:mtn": "mtn-ci",
    "cote-divoire:moov": "moov-ci",
    "cote-divoire:orange": "orange-money-ci",
    "cote-divoire:wave": "wave-ci",
    "cote-divoire:djamo": "djamo-ci",
    "senegal:orange": "orange-money-senegal",
    "senegal:free": "free-money-senegal",
    "senegal:expresso": "expresso-senegal",
    "senegal:wave": "wave-senegal",
    "senegal:djamo": "djamo-sn",
    "burkina-faso:orange": "orange-money-burkina",
    "burkina-faso:moov": "moov-burkina-faso",
    "mali:orange": "orange-money-mali",
    "togo:tmoney": "t-money-togo",
    "togo:moov": "moov-togo",
    "cameroon:mtn": "mtn-cameroun",
  };
  return modes[`${countryId}:${providerId}`] ?? null;
}

function paydunyaWithdrawalReceipt(
  operation: { id: string; reference: string; status: string; source_amount_xof: number; source_amount_minor?: number; source_currency?: string; wallet_currency?: string; created_at: string; phone_number?: string; country_id?: string },
  recipientName: string,
  providerName: string,
) {
  const phoneNumber = (operation.phone_number ?? "").replace(/^\+?(229|225|221|226|223|228|237)/, "");
  const currency = operation.wallet_currency ?? operation.source_currency ?? "XOF";
  const amount = minorToDisplayAmount(Number(operation.source_amount_minor ?? operation.source_amount_xof), currency);
  return {
    id: operation.id,
    reference: operation.reference,
    status: operation.status === "succeeded" ? "completed" : operation.status === "failed" || operation.status === "expired" ? "failed" : "pending",
    amount,
    fee: 0,
    totalAmount: amount,
    currency,
    createdAt: operation.created_at,
    recipientName,
    phoneNumber,
    providerName,
    paymentMethod: `Mobile Money (${providerName})`,
  };
}

async function bootstrap(auth: AuthContext) {
  const limit = rateLimit(`wallet:bootstrap:${auth.userId}`, 10, 60);
  if (!limit.allowed) return limited(limit.retryAfter);
  const { error } = await auth.supabase.rpc("provision_wallet_accounts", { p_user_id: auth.userId });
  if (error) {
    console.error("[zeno-financial-api] Wallet provisioning failed:", error);
    return json({ error: "Impossible de préparer le portefeuille." }, 502);
  }
  return json({ ready: true });
}

async function listRecipients(auth: AuthContext) {
  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    const ids = readContactIds(user.privateMetadata[CONTACTS_KEY]);
    if (!ids.length) return json({ recipients: [] });
    const contacts = await auth.clerk.users.getUserList({ userId: ids, limit: MAX_CONTACTS });
    const byId = new Map(contacts.data.map((contact) => [contact.id, contact]));
    return json({ recipients: ids.flatMap((id) => {
      const contact = byId.get(id);
      return contact ? [recipientFromClerkUser(contact)] : [];
    }) });
  } catch (cause) {
    console.error("[zeno-financial-api] Failed to list recipients:", cause);
    return json({ error: "Impossible de charger tes contacts pour le moment." }, 502);
  }
}

async function saveRecipient(request: Request, auth: AuthContext) {
  const limit = rateLimit(`recipients:save:${auth.userId}`, 60, 60);
  if (!limit.allowed) return limited(limit.retryAfter);
  const body = await readBody(request) as { recipientId?: unknown; email?: unknown } | null;
  let recipientId = typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
  if (!recipientId && typeof body?.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Adresse e-mail invalide." }, 400);
    try {
      const matches = await auth.clerk.users.getUserList({ emailAddress: [email], limit: 10 });
      const exact = matches.data.find((user) => user.emailAddresses.some((address) => address.emailAddress.toLowerCase() === email));
      if (!exact) return json({ error: "Aucun compte ZENO ne correspond à cette adresse." }, 404);
      recipientId = exact.id;
    } catch (cause) {
      console.error("[zeno-financial-api] Recipient email lookup failed:", cause);
      return json({ error: "Impossible de trouver ce compte pour le moment." }, 502);
    }
  }
  if (!recipientId || recipientId === auth.userId || recipientId.length > 128) return json({ error: "Bénéficiaire invalide." }, 400);
  try {
    const [owner, recipient] = await Promise.all([
      auth.clerk.users.getUser(auth.userId),
      auth.clerk.users.getUser(recipientId),
    ]);
    const ids = [recipientId, ...readContactIds(owner.privateMetadata[CONTACTS_KEY]).filter((id) => id !== recipientId)].slice(0, MAX_CONTACTS);
    await auth.clerk.users.updateUserMetadata(auth.userId, { privateMetadata: { [CONTACTS_KEY]: ids } });
    return json({ recipient: recipientFromClerkUser(recipient), recipients: ids });
  } catch (cause) {
    console.error("[zeno-financial-api] Failed to save recipient:", cause);
    return json({ error: "Impossible d’ajouter ce contact pour le moment." }, 502);
  }
}

async function removeRecipient(route: string, auth: AuthContext) {
  const recipientId = new URLSearchParams(route.split("?", 2)[1]).get("recipientId")?.trim() ?? "";
  if (!recipientId || recipientId.length > 128) return json({ error: "Contact invalide." }, 400);
  try {
    const owner = await auth.clerk.users.getUser(auth.userId);
    const ids = readContactIds(owner.privateMetadata[CONTACTS_KEY]).filter((id) => id !== recipientId);
    await auth.clerk.users.updateUserMetadata(auth.userId, { privateMetadata: { [CONTACTS_KEY]: ids } });
    return json({ recipients: ids });
  } catch (cause) {
    console.error("[zeno-financial-api] Failed to remove recipient:", cause);
    return json({ error: "Impossible de supprimer ce contact pour le moment." }, 502);
  }
}

async function searchRecipients(route: string, auth: AuthContext) {
  const query = new URLSearchParams(route.split("?", 2)[1]).get("query")?.trim() ?? "";
  if (!query || query.length > 80) return json({ error: "Saisis entre 1 et 80 caractères pour rechercher." }, 400);
  const limit = rateLimit(`recipients:search:${auth.userId}`, 300, 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de recherches. Attends un instant puis réessaie.");
  try {
    const result = await auth.clerk.users.getUserList({ query, limit: 100, orderBy: "-last_active_at" });
    const normalized = normalizeForSearch(query);
    const users = result.data.filter((user) => {
      if (user.id === auth.userId) return false;
      const name = [user.firstName, user.lastName, user.username].filter((part): part is string => Boolean(part?.trim())).join(" ");
      return normalizeForSearch(name).includes(normalized);
    });
    users.sort((left, right) => {
      const leftName = normalizeForSearch([left.firstName, left.lastName, left.username].filter(Boolean).join(" "));
      const rightName = normalizeForSearch([right.firstName, right.lastName, right.username].filter(Boolean).join(" "));
      return Number(!leftName.startsWith(normalized)) - Number(!rightName.startsWith(normalized));
    });
    return json({ recipients: users.slice(0, MAX_RESULTS).map(recipientFromClerkUser) });
  } catch (cause) {
    console.error("[zeno-financial-api] Recipient search failed:", cause);
    return json({ error: "La recherche est temporairement indisponible. Réessaie." }, 502);
  }
}

async function enrollPin(request: Request, auth: AuthContext) {
  const body = await readBody(request) as { pin?: unknown; currentPin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  const currentPin = typeof body?.currentPin === "string" ? body.currentPin : "";
  if (!/^\d{6}$/.test(pin)) return json({ error: "Le code PIN doit contenir 6 chiffres." }, 400);
  if (currentPin && !/^\d{6}$/.test(currentPin)) return json({ error: "Le code PIN actuel doit contenir 6 chiffres." }, 400);
  const limit = rateLimit(`security:pin-enroll:${auth.userId}`, 10, 15 * 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de tentatives. Réessaie dans 15 minutes.");
  const { data: existing, error: readError } = await auth.supabase.from("user_security_pins")
    .select("salt, pin_hash").eq("user_id", auth.userId).maybeSingle();
  if (readError) throw readError;
  if (existing) {
    const { data: lockRecord, error: lockError } = await auth.supabase.from("user_security_pins")
      .select("locked_until").eq("user_id", auth.userId).maybeSingle();
    if (lockError) throw lockError;
    if (lockRecord?.locked_until && new Date(lockRecord.locked_until).getTime() > Date.now()) {
      return json({ error: "Le PIN est temporairement bloqué. Réessaie dans 15 minutes." }, 423);
    }
    if (currentPin) {
      if (!await verifyPin(currentPin, existing.salt, existing.pin_hash)) {
        const { error } = await auth.supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
        if (error) throw error;
        return json({ error: "Le PIN actuel est incorrect." }, 401);
      }
      const salt = newPinSalt();
      const { error } = await auth.supabase.from("user_security_pins").update({
        salt, pin_hash: await hashPin(pin, salt), failed_attempts: 0,
        locked_until: null, updated_at: new Date().toISOString(),
      }).eq("user_id", auth.userId);
      if (error) throw error;
      return json({ registered: true });
    }
    if (await verifyPin(pin, existing.salt, existing.pin_hash)) return json({ registered: true });
    return json({ error: "Un PIN de transaction est déjà configuré. Vérifie le PIN actuel avant de le modifier." }, 409);
  }
  const salt = newPinSalt();
  const pinHash = await hashPin(pin, salt);
  const { error } = await auth.supabase.from("user_security_pins").insert({ user_id: auth.userId, salt, pin_hash: pinHash });
  if (error?.code === "23505") return json({ error: "Un PIN de transaction est déjà configuré." }, 409);
  if (error) throw error;
  return json({ registered: true }, 201);
}

async function transferZeno(request: Request, auth: AuthContext) {
  const limit = rateLimit(`transfer:zeno:${auth.userId}`, 20, 60);
  if (!limit.allowed) return limited(limit.retryAfter, "Trop de tentatives. Réessaie dans un instant.");
  const body = await readBody(request) as {
    recipientId?: unknown; amount?: unknown; currency?: unknown; pin?: unknown; idempotencyKey?: unknown;
  } | null;
  const recipientId = typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
  const currency = body?.currency;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (!recipientId || recipientId.length > 128 || recipientId === auth.userId) return json({ error: "Choose a valid ZENO recipient." }, 400);
  if (currency !== "USD" && currency !== "EUR" && currency !== "XOF") return json({ error: "Choose a supported wallet currency." }, 400);
  const amountMinor = toMinorUnits(body?.amount, currency);
  if (amountMinor === null) return json({ error: "Enter an amount using the supported precision for this currency." }, 400);
  if (!/^\d{6}$/.test(pin)) return json({ error: "Enter your 6-digit transaction PIN." }, 400);
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) return json({ error: "Transfer reference is invalid. Review the transfer and try again." }, 400);

  const { data: pinRecord, error: pinError } = await auth.supabase.from("user_security_pins")
    .select("salt, pin_hash, failed_attempts, locked_until").eq("user_id", auth.userId).maybeSingle();
  if (pinError) throw pinError;
  if (!pinRecord) return json({ error: "Set up your transaction PIN before sending money." }, 428);
  if (pinRecord.locked_until && new Date(pinRecord.locked_until).getTime() > Date.now()) {
    return json({ error: "PIN temporarily locked after too many attempts. Try again in 15 minutes." }, 423);
  }
  if (!await verifyPin(pin, pinRecord.salt, pinRecord.pin_hash)) {
    const { error } = await auth.supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
    if (error) throw error;
    return json({ error: "Incorrect transaction PIN." }, 401);
  }
  const { error: resetError } = await auth.supabase.rpc("reset_pin_failures", { p_user_id: auth.userId });
  if (resetError) throw resetError;

  const [sender, recipient] = await Promise.all([
    auth.clerk.users.getUser(auth.userId), auth.clerk.users.getUser(recipientId),
  ]);
  const reference = await makeReference(auth.userId, idempotencyKey);
  const { data, error } = await auth.supabase.rpc("transfer_zeno_wallet", {
    p_sender_user_id: auth.userId, p_recipient_user_id: recipient.id,
    p_idempotency_key: idempotencyKey, p_reference: reference, p_currency: currency,
    p_amount_minor: amountMinor, p_sender_name: displayName(sender), p_recipient_name: displayName(recipient),
  });
  if (error) {
    if (error.message.includes("Insufficient wallet balance")) return json({ error: "Your wallet balance is too low for this transfer." }, 422);
    if (error.code === "23505") return json({ error: "This transfer reference was already used. Review your transaction history." }, 409);
    console.error("[zeno-financial-api] Ledger posting failed:", error);
    return json({ error: "The transfer could not be completed. Check your history before retrying." }, 502);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.transaction_id || !row?.created_at) return json({ error: "The transfer was recorded but its receipt could not be loaded. Check your history." }, 502);
  const amount = amountMinor / (currency === "XOF" ? 1 : 100);
  return json({ transfer: {
    id: row.transaction_id, reference, status: "completed", amount, currency, fee: 0,
    totalAmount: amount, createdAt: row.created_at, recipientName: displayName(recipient), paymentMethod: "ZENO Wallet",
  } }, 201);
}

function getSupabaseAdminKey() {
  const keyMap = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keyMap) {
    try {
      const parsed = JSON.parse(keyMap) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      console.error("[zeno-financial-api] Supabase secret key map is invalid.");
      return null;
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? null;
}

function rateLimit(key: string, max: number, seconds: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + seconds * 1000 });
    return { allowed: true, retryAfter: 0 };
  }
  if (current.count >= max) return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function limited(retryAfter: number, message = "Trop d’actions. Réessaie dans un instant.") {
  return json({ error: message }, 429, { "retry-after": String(retryAfter) });
}

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(value), {
    status, headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "no-store", ...headers },
  });
}

async function readBody(request: Request) {
  try {
    const value: unknown = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function readContactIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, MAX_CONTACTS);
}

function recipientFromClerkUser(user: { id: string; firstName: string | null; lastName: string | null; username: string | null; imageUrl: string }) {
  const name = [user.firstName, user.lastName].filter((part): part is string => Boolean(part?.trim())).join(" ").trim();
  return { id: user.id, name: name || user.username || "ZENO User", zenoId: user.username ? `@${user.username}` : undefined, avatarUrl: user.imageUrl };
}

function normalizeForSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

function displayName(user: { firstName: string | null; lastName: string | null; username: string | null }) {
  return [user.firstName, user.lastName].filter((part): part is string => Boolean(part?.trim())).join(" ").trim() || user.username || "ZENO User";
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

async function makeReference(userId: string, idempotencyKey: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${userId}:${idempotencyKey}`));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 24).toUpperCase();
  return `ZP2P-${hash}`;
}

function newPinSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string, salt: string) {
  const pepper = Deno.env.get("PIN_HASH_SECRET")?.trim();
  if (!pepper || pepper.length < 32) throw new Error("PIN_HASH_SECRET must contain at least 32 characters.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(`${pin}:${pepper}`), "PBKDF2", false, ["deriveBits"]);
  const saltBytes = new Uint8Array(salt.match(/.{2}/g)?.map((part) => Number.parseInt(part, 16)) ?? []);
  const digest = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBytes, iterations: PIN_HASH_ITERATIONS, hash: "SHA-256" }, key, 512);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyPin(pin: string, salt: string, storedHash: string) {
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/i.test(storedHash)) return false;
  const actual = await hashPin(pin, salt);
  let difference = 0;
  for (let index = 0; index < 128; index += 1) difference |= actual.charCodeAt(index) ^ storedHash.toLowerCase().charCodeAt(index);
  return difference === 0;
}
