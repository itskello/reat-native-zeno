export type PaydunyaConfig = {
  masterKey: string;
  privateKey: string;
  token: string;
  apiBase: string;
  checkoutBase: string;
};

export type PaydunyaInvoice = {
  response_code?: string;
  response_text?: string;
  token?: string;
  hash?: string;
  invoice?: { token?: string; total_amount?: number | string };
  status?: string;
  disburse_token?: string;
  transaction_id?: string;
  fees?: string | number;
  total_amount?: string | number;
  amount?: string | number;
};

export function getPaydunyaConfig(): PaydunyaConfig | null {
  // Sandbox is the only mode enabled by this integration until production
  // onboarding, settlement, and the funds-holding model are approved.
  if ((Deno.env.get("PAYDUNYA_MODE") ?? "sandbox").trim() !== "sandbox") return null;
  const masterKey = Deno.env.get("PAYDUNYA_MASTER_KEY")?.trim();
  const privateKey = Deno.env.get("PAYDUNYA_PRIVATE_KEY")?.trim();
  const token = Deno.env.get("PAYDUNYA_TOKEN")?.trim();
  if (!masterKey || !privateKey || !token) return null;
  return {
    masterKey,
    privateKey,
    token,
    apiBase: "https://app.paydunya.com/sandbox-api/v1",
    checkoutBase: "https://app.paydunya.com/sandbox-checkout/invoice/",
  };
}

export function paydunyaChannel(countryId: string, providerId: string) {
  const channels: Record<string, string> = {
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
    "senegal:expresso": "expresso-sn",
    "senegal:wave": "wave-senegal",
    "senegal:djamo": "djamo-sn",
    "burkina-faso:orange": "orange-money-burkina",
    "burkina-faso:moov": "moov-burkina-faso",
    "mali:orange": "orange-money-mali",
    "mali:moov": "moov-ml",
    "togo:tmoney": "t-money-togo",
    "togo:moov": "moov-togo",
    "cameroon:mtn": "mtn-cameroun",
  };
  return channels[`${countryId}:${providerId}`] ?? null;
}

export async function createPaydunyaInvoice(
  config: PaydunyaConfig,
  input: {
    amountXof: number;
    description: string;
    channel: string;
    reference: string;
    operationId: string;
    callbackUrl: string;
    returnUrl: string;
  },
) {
  return await paydunyaRequest<PaydunyaInvoice>(config, `${config.apiBase}/checkout-invoice/create`, {
    method: "POST",
    body: JSON.stringify({
      invoice: {
        total_amount: input.amountXof,
        description: input.description,
        channels: [input.channel],
      },
      store: { name: "ZENO" },
      custom_data: {
        zeno_reference: input.reference,
        zeno_operation_id: input.operationId,
      },
      actions: {
        callback_url: input.callbackUrl,
        return_url: input.returnUrl,
        cancel_url: input.returnUrl,
      },
    }),
  });
}

export async function confirmPaydunyaInvoice(config: PaydunyaConfig, invoiceToken: string) {
  if (!/^[A-Za-z0-9_-]{4,160}$/.test(invoiceToken)) throw new Error("Invalid PayDunya invoice token.");
  return await paydunyaRequest<PaydunyaInvoice>(
    config,
    `${config.apiBase}/checkout-invoice/confirm/${encodeURIComponent(invoiceToken)}`,
    { method: "GET" },
  );
}

/** The PUSH API is documented at /api/v2/disburse (no separate sandbox URL). */
export async function createPaydunyaDisbursement(
  config: PaydunyaConfig,
  input: { phoneNumber: string; amountXof: number; withdrawMode: string; callbackUrl: string },
) {
  assertTestPayoutKey(config);
  return await paydunyaRequest<PaydunyaInvoice>(config, "https://app.paydunya.com/api/v2/disburse/get-invoice", {
    method: "POST",
    body: JSON.stringify({
      account_alias: input.phoneNumber,
      amount: input.amountXof,
      withdraw_mode: input.withdrawMode,
      callback_url: input.callbackUrl,
    }),
  });
}

export async function submitPaydunyaDisbursement(
  config: PaydunyaConfig,
  disburseToken: string,
  reference: string,
) {
  assertTestPayoutKey(config);
  return await paydunyaRequest<PaydunyaInvoice>(config, "https://app.paydunya.com/api/v2/disburse/submit-invoice", {
    method: "POST",
    body: JSON.stringify({ disburse_invoice: disburseToken, disburse_id: reference }),
  });
}

export async function checkPaydunyaDisbursement(config: PaydunyaConfig, disburseToken: string) {
  assertTestPayoutKey(config);
  return await paydunyaRequest<PaydunyaInvoice>(config, "https://app.paydunya.com/api/v2/disburse/check-status", {
    method: "POST",
    body: JSON.stringify({ disburse_invoice: disburseToken }),
  });
}

function assertTestPayoutKey(config: PaydunyaConfig) {
  // PayDunya documents its PUSH routes on the main API hostname, not on a
  // dedicated sandbox hostname. Only their documented test private keys may
  // ever reach those routes from this integration.
  if (!config.privateKey.startsWith("test_")) {
    throw new Error("PayDunya payout is restricted to test credentials.");
  }
}

export async function verifyPaydunyaHash(config: PaydunyaConfig, suppliedHash: unknown) {
  if (typeof suppliedHash !== "string" || !/^[a-f0-9]{128}$/i.test(suppliedHash)) return false;
  const expected = await sha512Hex(config.masterKey);
  return constantTimeEqual(expected, suppliedHash.toLowerCase());
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parsePaydunyaCallback(rawBody: string) {
  const params = new URLSearchParams(rawBody);
  const data: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(data, parsed);
  } catch {
    // PayDunya also posts form-encoded IPN payloads.
  }
  const direct = params.get("data");
  if (direct) {
    try {
      const parsed: unknown = JSON.parse(direct);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(data, parsed);
    } catch {
      // PayDunya can send bracket-encoded form keys instead of a JSON value.
    }
  }
  for (const [key, value] of params.entries()) {
    const match = key.match(/^data((?:\[[^\]]+\])+)$|^data\.(.+)$/);
    if (!match) continue;
    const parts = match[1]
      ? [...match[1].matchAll(/\[([^\]]+)\]/g)].map((item) => item[1])
      : match[2].split(".");
    if (!parts.length) continue;
    let target = data;
    for (const part of parts.slice(0, -1)) {
      const current = target[part];
      if (!current || typeof current !== "object" || Array.isArray(current)) target[part] = {};
      target = target[part] as Record<string, unknown>;
    }
    target[parts.at(-1)!] = value;
  }
  return data;
}

async function paydunyaRequest<T>(config: PaydunyaConfig, url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      "PAYDUNYA-MASTER-KEY": config.masterKey,
      "PAYDUNYA-PRIVATE-KEY": config.privateKey,
      "PAYDUNYA-TOKEN": config.token,
      ...init.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(`PayDunya request failed with HTTP ${response.status}.`);
  }
  return payload as T;
}

async function sha512Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}
