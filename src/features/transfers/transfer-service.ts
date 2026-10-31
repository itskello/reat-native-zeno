import { deleteAuthenticated, getAuthenticated, postAuthenticated } from "@/lib/api";
import type { CurrencyCode } from "@/types/content";
import type { Recipient } from "@/store/recipient-store";

export type TransferStatus = "completed" | "pending" | "failed";

export type TransferReceipt = {
  id: string;
  reference: string;
  status: TransferStatus;
  amount: number;
  currency: CurrencyCode;
  fee: number;
  totalAmount: number;
  createdAt: string;
  recipientName: string;
  paymentMethod: string;
};

export type ZenoTransferRequest = {
  recipientId: string;
  amount: number;
  currency: CurrencyCode;
  pin: string;
  idempotencyKey: string;
};

export type MobileMoneyTransferRequest = {
  countryId: string;
  providerId: string;
  phoneNumber: string;
  recipientName: string;
  amount: number;
  currency: CurrencyCode;
  idempotencyKey: string;
};

export type CreateRecipientRequest = {
  name: string;
  email: string;
};

/**
 * Client adapter for authenticated transfer endpoints. The server must
 * validate the PIN, recipient, quote, fees, available funds and provider
 * authorization, then record the transfer in its ledger before returning a
 * receipt. The mobile app never calculates or commits financial state.
 */
export const transferService = {
  listRecipients(sessionToken: string, signal?: AbortSignal) {
    return getAuthenticated<{ recipients: Recipient[] }>("/api/recipients", sessionToken, signal);
  },

  saveRecipient(sessionToken: string, recipientId: string) {
    return postAuthenticated<{ recipient: Recipient }>("/api/recipients", sessionToken, { recipientId });
  },

  removeRecipient(sessionToken: string, recipientId: string) {
    const params = new URLSearchParams({ recipientId });
    return deleteAuthenticated<{ recipients: string[] }>(`/api/recipients?${params.toString()}`, sessionToken);
  },

  searchRecipients(sessionToken: string, query: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ query });
    return getAuthenticated<{ recipients: Recipient[] }>(
      `/api/recipients/search?${params.toString()}`,
      sessionToken,
      signal
    );
  },

  addRecipient(sessionToken: string, request: CreateRecipientRequest) {
    return postTransferRequest<{ recipient: Recipient }>(
      "/api/recipients",
      sessionToken,
      request
    );
  },

  sendToZeno(sessionToken: string, request: ZenoTransferRequest) {
    return postTransferRequest<{ transfer: TransferReceipt }>(
      "/api/transfers/zeno",
      sessionToken,
      request
    );
  },

  sendToMobileMoney(
    sessionToken: string,
    request: MobileMoneyTransferRequest
  ) {
    return postTransferRequest<{ transfer: TransferReceipt }>(
      "/api/transfers/mobile-money",
      sessionToken,
      request
    );
  },
};

async function postTransferRequest<T>(path: string, token: string, body: unknown) {
  const result = await postAuthenticated<T>(path, token, body);
  if (!result.ok && result.error.toLowerCase().includes("card service")) {
    return {
      ok: false as const,
      error: "Le service de transfert n’est pas encore configuré sur ce serveur.",
    };
  }

  if (!result.ok) {
    return result;
  }

  if (path === "/api/recipients") {
    const recipient = (result.data as { recipient?: Recipient }).recipient;
    if (!recipient || !isNonEmptyString(recipient.id) || !isNonEmptyString(recipient.name)) {
      return { ok: false as const, error: "Le serveur a renvoyé un bénéficiaire incomplet." };
    }
    return result;
  }

  const transfer = (result.data as { transfer?: TransferReceipt }).transfer;
  const supportedCurrency = transfer?.currency === "XOF" || transfer?.currency === "USD" || transfer?.currency === "EUR";
  const supportedStatus = transfer?.status === "completed" || transfer?.status === "pending" || transfer?.status === "failed";
  if (
    !transfer ||
    !isNonEmptyString(transfer.id) ||
    !isNonEmptyString(transfer.reference) ||
    !isNonEmptyString(transfer.recipientName) ||
    !isNonEmptyString(transfer.createdAt) ||
    !isNonEmptyString(transfer.paymentMethod) ||
    !supportedStatus ||
    !supportedCurrency ||
    !Number.isFinite(transfer.amount) ||
    !Number.isFinite(transfer.fee) ||
    !Number.isFinite(transfer.totalAmount)
  ) {
    return { ok: false as const, error: "La réponse du serveur est incomplète." };
  }

  return result;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
