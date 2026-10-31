import { postAuthenticated } from "@/lib/api";
import type { CountryId, CurrencyCode } from "@/types/content";

export type WithdrawalReceipt = {
  id: string;
  reference: string;
  status: "completed" | "pending" | "failed";
  amount: number;
  fee: number;
  totalAmount: number;
  currency: CurrencyCode;
  createdAt: string;
  recipientName: string;
  phoneNumber: string;
  providerName: string;
  paymentMethod: string;
};

export type CreateWithdrawalRequest = {
  countryId: CountryId;
  providerId: string;
  phoneNumber: string;
  recipientName: string;
  amount: number;
  currency: CurrencyCode;
  pin: string;
  idempotencyKey: string;
};

/**
 * The server validates balance, fees, PIN and provider authorization, then
 * writes the ledger entry before returning a receipt. The client never
 * simulates a successful payout.
 */
export const withdrawalService = {
  async create(token: string, request: CreateWithdrawalRequest) {
    const result = await postAuthenticated<{ withdrawal: WithdrawalReceipt }>(
      "/api/withdrawals",
      token,
      request
    );
    if (!result.ok) return result;

    const withdrawal = result.data.withdrawal;
    if (
      !withdrawal ||
      !withdrawal.id ||
      !withdrawal.reference ||
      !withdrawal.createdAt ||
      !withdrawal.recipientName ||
      !withdrawal.paymentMethod ||
      !["completed", "pending", "failed"].includes(withdrawal.status) ||
      !["XOF", "USD", "EUR"].includes(withdrawal.currency) ||
      !Number.isFinite(withdrawal.amount) ||
      !Number.isFinite(withdrawal.fee) ||
      !Number.isFinite(withdrawal.totalAmount)
    ) {
      return {
        ok: false as const,
        error: "La réponse du serveur est incomplète. Vérifie l’historique avant de réessayer.",
      };
    }

    return result;
  },
};
