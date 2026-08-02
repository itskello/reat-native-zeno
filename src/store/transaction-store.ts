import type { Transaction } from "@/types/wallet";
import { create } from "zustand";

/**
 * Transaction history state.
 *
 * PLACEHOLDER data for now so the Wallet Home list can be built. The backend
 * is the source of truth for real transactions (see AGENTS.md — Financial Data
 * Rules); `loadTransactions` is where the real fetch is wired later. Financial
 * records are never deleted — this store only ever reads.
 */

const PLACEHOLDER_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_001",
    typeId: "sent",
    title: "Zeno",
    description: "Monthly subscription",
    amount: 6,
    direction: "out",
    status: "pending",
    createdAt: "2026-07-30T09:12:00.000Z",
  },
  {
    id: "txn_002",
    typeId: "sent",
    title: "Zeno",
    description: "Monthly subscription",
    amount: 6,
    direction: "out",
    status: "pending",
    createdAt: "2026-07-29T09:12:00.000Z",
  },
  {
    id: "txn_003",
    typeId: "received",
    title: "Amara K.",
    description: "Invoice payment",
    amount: 25000,
    direction: "in",
    status: "completed",
    createdAt: "2026-07-28T14:03:00.000Z",
  },
  {
    id: "txn_004",
    typeId: "deposit",
    title: "MTN Mobile Money",
    description: "Wallet top-up",
    amount: 15000,
    direction: "in",
    status: "completed",
    createdAt: "2026-07-27T18:45:00.000Z",
  },
  {
    id: "txn_005",
    typeId: "withdrawal",
    title: "Moov Money",
    description: "Cash out",
    amount: 10000,
    direction: "out",
    status: "completed",
    createdAt: "2026-07-26T11:20:00.000Z",
  },
];

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  loadTransactions: () => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: PLACEHOLDER_TRANSACTIONS,
  isLoading: false,
  loadTransactions: async () => {
    set({ isLoading: true });
    // TODO: fetch the real transaction history from the backend and set it here.
    set({ transactions: PLACEHOLDER_TRANSACTIONS, isLoading: false });
  },
}));
