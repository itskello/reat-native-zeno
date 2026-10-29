import { useNotificationStore } from "@/store/notification-store";
import { useTransactionStore } from "@/store/transaction-store";

type CardMovement = {
  amount: string;
  direction: "topup" | "withdraw";
  transactionId: string;
  isSandbox: boolean;
};

/** Add a confirmed card movement to the in-app activity and notification feeds. */
export function recordCardMovement({
  amount,
  direction,
  transactionId,
  isSandbox,
}: CardMovement) {
  const now = new Date();
  const value = Number(amount);
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  const timeLabel = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);
  const formattedAmount = value.toFixed(2);
  const isTopUp = direction === "topup";

  useTransactionStore.getState().addTransaction({
    id: transactionId,
    typeId: "card_payment",
    category: "card",
    title: isTopUp ? "Recharge ZENO Card" : "Transfert depuis la ZENO Card",
    description: isTopUp ? "Wallet ZENO → carte" : "Carte ZENO → wallet",
    amount: value,
    totalAmount: value,
    fee: 0,
    currency: "USD",
    direction: isTopUp ? "out" : "in",
    status: "completed",
    dateLabel,
    timeLabel,
    shortId: `${transactionId.slice(0, 8)}…`,
    createdAt: now.toISOString(),
    recipientOrSender: isTopUp ? "ZENO Card" : "ZENO Wallet",
    reference: transactionId,
    paymentMethod: isSandbox ? "Wallet de démo" : "ZENO Wallet",
    note: isSandbox
      ? "Opération de démonstration, sans argent réel."
      : "Mouvement confirmé par le service carte.",
  });

  useNotificationStore.getState().addNotification({
    id: `card-${transactionId}`,
    type: "transaction",
    message: isSandbox
      ? `${isTopUp ? "Recharge démo" : "Transfert démo"} de ${formattedAmount} USD effectué. Aucun argent réel n'a été déplacé.`
      : `${isTopUp ? "Carte ZENO rechargée" : "Transfert vers le wallet"} : ${formattedAmount} USD.`,
    timeLabel,
    createdAt: now.toISOString(),
    read: false,
  });
}
