import type { CurrencyCode } from "@/types/content";

/**
 * Indicative rates used only to update the Add Money preview while typing.
 * The deposit API remains responsible for the final rate and credited amount.
 */
const XOF_PER_WALLET_UNIT: Record<CurrencyCode, number> = {
  XOF: 1,
  USD: 603.24,
  EUR: 655.957,
};

export function estimateDepositWalletAmount(amountXof: number, currency: CurrencyCode) {
  const rate = XOF_PER_WALLET_UNIT[currency];
  const amount = amountXof / rate;
  return currency === "XOF" ? Math.round(amount) : Math.round(amount * 100) / 100;
}

export function convertWalletAmountToXof(amount: number, currency: CurrencyCode) {
  return Math.max(0, Math.round(amount * XOF_PER_WALLET_UNIT[currency]));
}

export function formatWalletAmountInput(amount: number, currency: CurrencyCode) {
  return currency === "XOF" ? String(Math.round(amount)) : amount.toFixed(2);
}

export function getDepositPreviewRateLabel(currency: CurrencyCode, language: "en" | "fr" = "en") {
  if (currency === "XOF") return "1 XOF = 1 XOF";
  const rate = XOF_PER_WALLET_UNIT[currency];
  return `1 ${currency} = ${rate.toLocaleString(language === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 3 })} XOF`;
}
