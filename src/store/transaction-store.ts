import { useLanguageStore } from "@/store/language-store";
import type { Transaction } from "@/types/wallet";
import { create } from "zustand";
import { getWalletActivity } from "@/features/wallet/wallet-read-service";
import { isFinancialSandboxEnabled } from "@/features/wallet/financial-mode";
import type { CurrencyCode, TransactionTypeId } from "@/types/content";

function makeDemoOpeningTransaction(): Transaction[] {
  if (!isFinancialSandboxEnabled) return [];

  const now = new Date();
  const locale = "en-US";
  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);

  return [{
    id: "demo-opening-wallet",
    typeId: "deposit",
    category: "received",
    title: "Demo starting balance",
    description: "ZENO test credit",
    amount: 100,
    totalAmount: 100,
    fee: 0,
    currency: "USD",
    direction: "in",
    status: "completed",
    dateLabel,
    timeLabel,
    shortId: "demo-100",
    createdAt: now.toISOString(),
    recipientOrSender: "ZENO Demo",
    reference: "DEMO-OPENING-BALANCE",
    paymentMethod: "Demo wallet",
    note: "Development-only demo balance. No real money.",
    localized: {
      en: {
        title: "Demo starting balance",
        description: "ZENO test credit",
        paymentMethod: "Demo wallet",
        note: "Development-only demo balance. No real money.",
      },
      fr: {
        title: "Solde de démonstration",
        description: "Crédit de test ZENO",
        paymentMethod: "Wallet de démonstration",
        note: "Solde fictif de développement. Aucun argent réel.",
      },
    },
  }];
}

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  loadTransactions: (getToken?: () => Promise<string | null>) => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
};

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: makeDemoOpeningTransaction(),
  isLoading: false,
  loadTransactions: async (getToken) => {
    if (isFinancialSandboxEnabled) return;
    if (!getToken) {
      set({ transactions: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const language = useLanguageStore.getState().language;
      const locale = language === "fr" ? "fr-FR" : "en-US";
      const activity = await getWalletActivity(getToken);
      const transactions: Transaction[] = activity.map((item) => {
        const incoming = item.direction === "in";
        const isCard = item.kind.startsWith("card_");
        const typeId: TransactionTypeId = isCard
          ? "card_payment"
          : item.kind === "deposit"
            ? "deposit"
            : item.kind === "withdrawal"
              ? "withdrawal"
              : item.kind === "payment_request"
                ? "payment_request"
                : item.kind === "payment_link"
                  ? "payment_link"
                  : incoming ? "received" : "sent";
        const metadataTitle = item.kind === "p2p_transfer"
          ? incoming ? item.metadata.senderName : item.metadata.recipientName
          : item.metadata.counterpartyName ?? item.metadata.merchantName;
        const title = typeof metadataTitle === "string"
          ? metadataTitle
          : transactionTitle(typeId, language);
        const date = new Date(item.createdAt);

        return {
          id: item.id,
          typeId,
          category: isCard ? "card" : incoming ? "received" : "sent",
          title,
          description: transactionTitle(typeId, language),
          localized: {
            en: {
              ...(typeof metadataTitle === "string" ? {} : { title: transactionTitle(typeId, "en") }),
              description: transactionTitle(typeId, "en"),
            },
            fr: {
              ...(typeof metadataTitle === "string" ? {} : { title: transactionTitle(typeId, "fr") }),
              description: transactionTitle(typeId, "fr"),
            },
          },
          amount: item.amount,
          totalAmount: item.amount + item.fee,
          fee: item.fee,
          currency: item.currency as CurrencyCode,
          direction: item.direction,
          status: "completed",
          createdAt: item.createdAt,
          dateLabel: Number.isNaN(date.getTime()) ? undefined : new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(date),
          timeLabel: Number.isNaN(date.getTime()) ? undefined : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date),
          shortId: item.reference ?? item.id.slice(0, 8),
          recipientOrSender: title,
          reference: item.reference ?? undefined,
        };
      });
      set({ transactions });
    } catch (error) {
      if (__DEV__) console.warn("[wallet] Could not load wallet activity:", error);
      set({ transactions: [] });
    } finally {
      set({ isLoading: false });
    }
  },
  addTransaction: (transaction) =>
    set((state) =>
      state.transactions.some((item) => item.id === transaction.id)
        ? state
        : { transactions: [transaction, ...state.transactions] }
    ),
}));

function transactionTitle(type: TransactionTypeId, language: "en" | "fr") {
  const labels: Record<TransactionTypeId, { en: string; fr: string }> = {
    sent: { en: "Money sent", fr: "Argent envoyé" },
    received: { en: "Money received", fr: "Argent reçu" },
    deposit: { en: "Wallet deposit", fr: "Dépôt sur le Wallet" },
    withdrawal: { en: "Wallet withdrawal", fr: "Retrait du Wallet" },
    payment_request: { en: "Payment request", fr: "Demande de paiement" },
    card_payment: { en: "Card activity", fr: "Opération par carte" },
    payment_link: { en: "Payment link", fr: "Lien de paiement" },
  };
  return labels[type][language];
}
