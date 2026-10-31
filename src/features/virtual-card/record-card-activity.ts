import { useNotificationStore } from "@/store/notification-store";
import { useTransactionStore } from "@/store/transaction-store";
import { useLanguageStore } from "@/store/language-store";

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
  const language = useLanguageStore.getState().language;
  const dateLocale = language === "fr" ? "fr-FR" : "en-US";
  const dateLabel = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  const timeLabel = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);
  const formattedAmount = value.toFixed(2);
  const isTopUp = direction === "topup";

  useTransactionStore.getState().addTransaction({
    id: transactionId,
    typeId: "card_payment",
    category: "card",
    title: isTopUp ? "Recharge de la carte ZENO" : "Transfert depuis la carte ZENO",
    description: isTopUp
      ? "Depuis le portefeuille ZENO"
      : "Vers le portefeuille ZENO",
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
    message: language === "fr"
      ? isSandbox
        ? `${isTopUp ? "Recharge démo" : "Transfert démo"} de ${formattedAmount} USD effectué. Aucun argent réel n'a été déplacé.`
        : `${isTopUp ? "Carte ZENO rechargée" : "Transfert vers le wallet"} : ${formattedAmount} USD.`
      : isSandbox
        ? `${isTopUp ? "Demo top up" : "Demo transfer"} of ${formattedAmount} USD completed. No real money was moved.`
        : `${isTopUp ? "ZENO Card topped up" : "Transfer to wallet"}: ${formattedAmount} USD.`,
    timeLabel,
    createdAt: now.toISOString(),
    read: false,
  });
}
