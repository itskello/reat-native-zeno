/** Server-only pawaPay Merchant API v2 client. Never import from the app. */
export type PawaPayMode = "sandbox" | "production";

export type PawaPayConfig = {
  mode: PawaPayMode;
  apiToken: string;
  apiBase: string;
};

export type PawaPayOperation = "deposit" | "payout";

export type PawaPayInitiation = {
  id: string;
  status: "ACCEPTED";
  created?: string;
  raw: Record<string, unknown>;
};

export type PawaPayStatus = {
  status: "FOUND" | "NOT_FOUND";
  operationStatus?: "ACCEPTED" | "PROCESSING" | "COMPLETED" | "FAILED" | "ENQUEUED" | "RECONCILING";
  amount?: string;
  currency?: string;
  country?: string;
  provider?: string;
  phoneNumber?: string;
  raw: Record<string, unknown>;
};

export class PawaPayApiError extends Error {
  constructor(message: string, readonly httpStatus: number) {
    super(message);
    this.name = "PawaPayApiError";
  }
}

const SANDBOX_BASE = "https://api.sandbox.pawapay.io";
const PRODUCTION_BASE = "https://api.pawapay.io";

export function getPawaPayConfig(): PawaPayConfig | null {
  const mode = Deno.env.get("PAWAPAY_MODE")?.trim();
  const apiToken = Deno.env.get("PAWAPAY_API_TOKEN")?.trim();
  if ((mode !== "sandbox" && mode !== "production") || !apiToken) return null;
  // A live endpoint must never be selected by a typo or a missing environment flag.
  if (mode === "production" && Deno.env.get("PAWAPAY_LIVE_ENABLED")?.trim() !== "true") return null;
  return {
    mode,
    apiToken,
    apiBase: mode === "sandbox" ? SANDBOX_BASE : PRODUCTION_BASE,
  };
}

export async function getPawaPayActiveConfiguration(config: PawaPayConfig) {
  return await pawaPayRequest<Record<string, unknown>>(config, "/v2/active-conf", { method: "GET" });
}

export async function createPawaPayDeposit(
  config: PawaPayConfig,
  input: {
    id: string;
    amount: string;
    currency: string;
    provider: string;
    phoneNumber: string;
    clientReferenceId: string;
    customerMessage: string;
  },
): Promise<PawaPayInitiation> {
  const result = await pawaPayRequest<Record<string, unknown>>(config, "/v2/deposits", {
    method: "POST",
    body: JSON.stringify({
      depositId: input.id,
      payer: { type: "MMO", accountDetails: { provider: input.provider, phoneNumber: input.phoneNumber } },
      amount: input.amount,
      currency: input.currency,
      clientReferenceId: input.clientReferenceId,
      customerMessage: input.customerMessage,
    }),
  });
  return parseInitiation(result, "depositId");
}

export async function createPawaPayPayout(
  config: PawaPayConfig,
  input: {
    id: string;
    amount: string;
    currency: string;
    provider: string;
    phoneNumber: string;
    clientReferenceId: string;
    customerMessage: string;
  },
): Promise<PawaPayInitiation> {
  const result = await pawaPayRequest<Record<string, unknown>>(config, "/v2/payouts", {
    method: "POST",
    body: JSON.stringify({
      payoutId: input.id,
      recipient: { type: "MMO", accountDetails: { provider: input.provider, phoneNumber: input.phoneNumber } },
      amount: input.amount,
      currency: input.currency,
      clientReferenceId: input.clientReferenceId,
      customerMessage: input.customerMessage,
    }),
  });
  return parseInitiation(result, "payoutId");
}

export async function getPawaPayOperationStatus(
  config: PawaPayConfig,
  operation: PawaPayOperation,
  id: string,
): Promise<PawaPayStatus> {
  if (!isUuid(id)) throw new Error("Invalid pawaPay operation id.");
  const result = await pawaPayRequest<Record<string, unknown>>(
    config,
    `/v2/${operation === "deposit" ? "deposits" : "payouts"}/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
  const data = isRecord(result.data) ? result.data : result;
  const rawStatus = typeof data.status === "string" ? data.status : undefined;
  const allowed = new Set(["ACCEPTED", "PROCESSING", "COMPLETED", "FAILED", "ENQUEUED", "RECONCILING"]);
  const recipient = isRecord(data.recipient) ? data.recipient : isRecord(data.payer) ? data.payer : {};
  const accountDetails = isRecord(recipient.accountDetails) ? recipient.accountDetails : {};
  return {
    status: result.status === "NOT_FOUND" ? "NOT_FOUND" : "FOUND",
    operationStatus: rawStatus && allowed.has(rawStatus) ? rawStatus as PawaPayStatus["operationStatus"] : undefined,
    amount: typeof data.amount === "string" ? data.amount : undefined,
    currency: typeof data.currency === "string" ? data.currency : undefined,
    country: typeof data.country === "string" ? data.country : undefined,
    provider: typeof accountDetails.provider === "string" ? accountDetails.provider : undefined,
    phoneNumber: typeof accountDetails.phoneNumber === "string" ? accountDetails.phoneNumber : undefined,
    raw: result,
  };
}

function parseInitiation(result: Record<string, unknown>, idKey: "depositId" | "payoutId"): PawaPayInitiation {
  const id = typeof result[idKey] === "string" ? result[idKey] as string : "";
  if (!isUuid(id) || result.status !== "ACCEPTED") {
    throw new Error("pawaPay did not accept the operation.");
  }
  return {
    id,
    status: "ACCEPTED",
    created: typeof result.created === "string" ? result.created : undefined,
    raw: result,
  };
}

async function pawaPayRequest<T extends Record<string, unknown>>(
  config: PawaPayConfig,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${config.apiBase}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${config.apiToken}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* A provider error can be non-JSON. */ }
  if (!response.ok || !isRecord(body)) {
    const errorCode = isRecord(body) && isRecord(body.failureReason) && typeof body.failureReason.failureCode === "string"
      ? body.failureReason.failureCode
      : `HTTP_${response.status}`;
    throw new PawaPayApiError(`pawaPay ${config.mode} request failed (${errorCode}).`, response.status);
  }
  return body as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
