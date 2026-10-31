import { getAuthenticated, postAuthenticated } from "@/lib/api";
import * as SecureStore from "expo-secure-store";
import type { CurrencyCode } from "@/types/content";

export type AddMoneyCountry = "benin" | "cote-divoire";

export type AddMoneySender = {
  id: string;
  name?: string;
  countryId: AddMoneyCountry;
  phoneNumber: string;
  providerId: string | null;
  providerName: string | null;
};

export type AddMoneyReceipt = {
  id: string;
  reference: string;
  status: "pending" | "completed" | "failed";
  amountXof: number;
  walletAmount: number;
  walletCurrency: CurrencyCode;
  fee: number;
  totalAmount: number;
  exchangeRate?: string;
  createdAt: string;
  senderName?: string;
  phoneNumber: string;
  countryId: AddMoneyCountry;
  providerName: string;
};

export type CreateAddMoneyRequest = {
  countryId: AddMoneyCountry;
  providerId: string;
  phoneNumber: string;
  senderName?: string;
  amountXof: number;
  walletCurrency: CurrencyCode;
  idempotencyKey: string;
};

/**
 * Authenticated app-facing contract. The server owns conversion, fees,
 * provider authorization and the ledger; the client never credits a wallet.
 */
export const addMoneyService = {
  async listSenders(sessionToken: string, userId: string, signal?: AbortSignal) {
    const result = await getAuthenticated<{ senders: AddMoneySender[] }>(
      "/api/deposits/senders",
      sessionToken,
      signal
    );
    if (result.ok) {
      const local = await readLocalSenders(userId);
      return { ok: true as const, data: { senders: mergeSenders(result.data.senders, local) } };
    }
    if (result.status === 503) {
      return { ok: true as const, data: { senders: await readLocalSenders(userId) } };
    }
    return result;
  },

  async saveSender(
    sessionToken: string,
    userId: string,
    sender: Omit<AddMoneySender, "id" | "providerId" | "providerName"> & { providerId: string; providerName: string }
  ) {
    const result = await postAuthenticated<{ sender: AddMoneySender }>(
      "/api/deposits/senders",
      sessionToken,
      sender
    );
    if (!result.ok) {
      if (result.status !== 503) return result;
      const localSender = makeSender(sender);
      const saved = await saveLocalSender(userId, localSender);
      return saved
        ? { ok: true as const, data: { sender: localSender } }
        : { ok: false as const, error: "Impossible d’enregistrer cet expéditeur sur cet appareil." };
    }
    const saved = result.data.sender;
    if (!saved || !saved.id || !saved.phoneNumber || !saved.countryId || !saved.providerId || !saved.providerName) {
      return { ok: false as const, error: "Le serveur a renvoyé un contact incomplet." };
    }
    await saveLocalSender(userId, saved);
    return result;
  },

  async create(sessionToken: string, request: CreateAddMoneyRequest) {
    const result = await postAuthenticated<{ deposit: AddMoneyReceipt }>(
      "/api/deposits/mobile-money",
      sessionToken,
      request
    );
    if (!result.ok) return result;

    const deposit = result.data.deposit;
    const supportedCurrency = ["XOF", "USD", "EUR"].includes(deposit?.walletCurrency);
    const supportedStatus = ["pending", "completed", "failed"].includes(deposit?.status);
    if (
      !deposit?.id ||
      !deposit.reference ||
      !deposit.createdAt ||
      !deposit.phoneNumber ||
      !deposit.countryId ||
      !deposit.providerName ||
      !supportedCurrency ||
      !supportedStatus ||
      !Number.isFinite(deposit.amountXof) ||
      deposit.amountXof <= 0 ||
      !Number.isFinite(deposit.walletAmount) ||
      deposit.walletAmount < 0 ||
      !Number.isFinite(deposit.fee) ||
      deposit.fee < 0 ||
      !Number.isFinite(deposit.totalAmount) ||
      deposit.totalAmount < deposit.walletAmount
    ) {
      return {
        ok: false as const,
        error: "La réponse du serveur est incomplète. Vérifie l’historique avant de réessayer.",
      };
    }

    return result;
  },
};

const localSendersKey = (userId: string) => `zeno_add_money_senders_${userId}`;

async function readLocalSenders(userId: string): Promise<AddMoneySender[]> {
  try {
    const raw = await SecureStore.getItemAsync(localSendersKey(userId));
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value.filter(isSavedSender) : [];
  } catch {
    return [];
  }
}

async function saveLocalSender(userId: string, sender: AddMoneySender) {
  try {
    const existing = await readLocalSenders(userId);
    await SecureStore.setItemAsync(
      localSendersKey(userId),
      JSON.stringify(mergeSenders([sender], existing))
    );
    return true;
  } catch {
    return false;
  }
}

function mergeSenders(...groups: AddMoneySender[][]) {
  const byId = new Map<string, AddMoneySender>();
  groups.flat().forEach((sender) => byId.set(sender.id, sender));
  return [...byId.values()];
}

function makeSender(sender: Omit<AddMoneySender, "id">): AddMoneySender {
  const digits = sender.phoneNumber.replace(/\D/g, "");
  return { ...sender, id: `${sender.countryId}:${sender.providerId}:${digits}` };
}

function isSavedSender(value: unknown): value is AddMoneySender {
  if (!value || typeof value !== "object") return false;
  const sender = value as Partial<AddMoneySender>;
  return typeof sender.id === "string" &&
    (sender.countryId === "benin" || sender.countryId === "cote-divoire") &&
    typeof sender.phoneNumber === "string" &&
    typeof sender.providerId === "string" &&
    typeof sender.providerName === "string";
}
