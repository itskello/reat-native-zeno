import { colors } from "@/theme/colors";
import type { TransactionType, TransactionTypeId } from "@/types/content";

/**
 * Transaction types shown across the wallet and history.
 *
 * Colors are pulled from the ZENO design system (see AGENTS.md — Design
 * System) so the palette stays consistent and traceable:
 * - money in        → green   (success)
 * - primary action  → blue    (zenoBlue)
 * - money out / care → amber   (warning)
 * - card / premium   → dark    (zenoDark)
 *
 * `iconKey` is a semantic key the UI maps to an icon component; the data layer
 * stays free of UI imports.
 */
export const transactionTypes: Record<TransactionTypeId, TransactionType> = {
  received: {
    id: "received",
    label: "Received",
    iconKey: "arrow-down-left",
    color: colors.success,
  },
  sent: {
    id: "sent",
    label: "Sent",
    iconKey: "arrow-up-right",
    color: colors.zenoBlue,
  },
  deposit: {
    id: "deposit",
    label: "Deposit",
    iconKey: "plus-circle",
    color: colors.success,
  },
  withdrawal: {
    id: "withdrawal",
    label: "Withdrawal",
    iconKey: "arrow-up-circle",
    color: colors.warning,
  },
  payment_request: {
    id: "payment_request",
    label: "Payment Request",
    iconKey: "hand-coins",
    color: colors.zenoBlue,
  },
  card_payment: {
    id: "card_payment",
    label: "Card Payment",
    iconKey: "credit-card",
    color: colors.zenoDark,
  },
  payment_link: {
    id: "payment_link",
    label: "Payment Link",
    iconKey: "link",
    color: colors.zenoBlue,
  },
};

/** Look up the metadata for a transaction type. */
export function getTransactionType(id: TransactionTypeId): TransactionType {
  return transactionTypes[id];
}
