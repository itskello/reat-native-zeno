import { useNotificationStore } from "@/store/notification-store";
import { useTransactionStore } from "@/store/transaction-store";
import { useLanguageStore } from "@/store/language-store";

type CardMovement = {
  amount: string;
  walletBalance: number;
  cardBalance: number;
  direction: "topup" | "withdraw";
  transactionId: string;
  isSandbox: boolean;
};

/** Add a confirmed card movement to the in-app activity and notification feeds. */
export function recordCardMovement({
  amount,
  walletBalance,
  cardBalance,
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
  const formatUsdIn = (amount: number, locale: string) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const isTopUp = direction === "topup";
  const notificationMessage = (locale: "fr-FR" | "en-US") => {
    const amountLabel = formatUsdIn(value, locale);
    const walletLabel = formatUsdIn(walletBalance, locale);
    const cardLabel = formatUsdIn(cardBalance, locale);
    if (locale === "fr-FR") {
      return isSandbox
        ? isTopUp
          ? `Recharge démo de ${amountLabel} USD effectuée. Wallet : ${walletLabel} USD · carte : ${cardLabel} USD. Aucun argent réel n’a été déplacé.`
          : `Transfert démo de ${amountLabel} USD de la carte vers le Wallet. Wallet : ${walletLabel} USD · carte : ${cardLabel} USD. Aucun argent réel n’a été déplacé.`
        : `${isTopUp ? "Carte ZENO rechargée" : "Transfert vers le Wallet"} : ${amountLabel} USD.`;
    }
    return isSandbox
      ? isTopUp
        ? `Demo top up of ${amountLabel} USD completed. Wallet: ${walletLabel} USD · card: ${cardLabel} USD. No real money was moved.`
        : `Demo transfer of ${amountLabel} USD from card to Wallet completed. Wallet: ${walletLabel} USD · card: ${cardLabel} USD. No real money was moved.`
      : `${isTopUp ? "ZENO Card topped up" : "Transfer to Wallet"}: ${amountLabel} USD.`;
  };

  useTransactionStore.getState().addTransaction({
    id: transactionId,
    typeId: "card_payment",
    category: "card",
    title: language === "fr"
      ? isTopUp ? "Recharge de la carte ZENO" : "Transfert de la carte ZENO"
      : isTopUp ? "ZENO Card top up" : "Transfer from ZENO Card",
    description: language === "fr"
      ? isTopUp ? "Depuis le Wallet principal" : "Vers le Wallet principal"
      : isTopUp ? "From the main Wallet" : "To the main Wallet",
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
    paymentMethod: isSandbox
      ? language === "fr" ? "Wallet de démonstration" : "Demo Wallet"
      : "ZENO Wallet",
    note: isSandbox
      ? "Opération de démonstration, sans argent réel."
      : "Mouvement confirmé par le service carte.",
  });

  useNotificationStore.getState().addNotification({
    id: `card-${transactionId}`,
    type: "transaction",
    message: language === "fr" ? notificationMessage("fr-FR") : notificationMessage("en-US"),
    messageByLanguage: {
      en: notificationMessage("en-US"),
      fr: notificationMessage("fr-FR"),
    },
    timeLabel,
    createdAt: now.toISOString(),
    read: false,
  });
}
