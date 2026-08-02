import type { CurrencyCode, TransactionTypeId } from "@/types/content";

/**
 * Runtime wallet & transaction shapes.
 *
 * These describe *instances* of financial data the UI renders. The backend is
 * the source of truth for real values (see AGENTS.md — Financial Data Rules);
 * these types just give the client a clean, strictly-typed shape to build
 * against while the backend integration is pending.
 */

export type Wallet = {
  /** Available balance in the smallest whole unit of `currency` (XOF has none). */
  balance: number;
  currency: CurrencyCode;
};

export type TransactionStatus = "pending" | "completed" | "failed";

/** Money coming into the wallet vs leaving it. */
export type TransactionDirection = "in" | "out";

export type Transaction = {
  id: string;
  typeId: TransactionTypeId;
  /** Primary label, e.g. a counterparty or merchant name. */
  title: string;
  /** Secondary line, e.g. "Monthly subscription". */
  description: string;
  /** Absolute amount in `Wallet.currency` units. Sign is derived from `direction`. */
  amount: number;
  direction: TransactionDirection;
  status: TransactionStatus;
  /** ISO 8601 timestamp. */
  createdAt: string;
};
