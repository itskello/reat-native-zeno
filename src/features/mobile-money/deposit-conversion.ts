import type { CurrencyCode } from "@/types/content";

/**
 * Indicative rates used only to update the Add Money preview while typing.
 * The deposit API remains responsible for the final rate and credited amount.
 */
const LOCAL_CURRENCIES = new Set<CurrencyCode>(["XOF", "GHS", "NGN", "XAF", "CDF"]);

export function estimateDepositWalletAmount(amountXof: number, currency: CurrencyCode) {
  return LOCAL_CURRENCIES.has(currency) ? amountXof : 0;
}

export function convertWalletAmountToXof(amount: number, currency: CurrencyCode) {
  return LOCAL_CURRENCIES.has(currency) ? Math.max(0, amount) : 0;
}

export function formatWalletAmountInput(amount: number, currency: CurrencyCode) {
  return currency === "XOF" || currency === "XAF" ? String(Math.round(amount)) : amount.toFixed(2);
}

export function getDepositPreviewRateLabel(currency: CurrencyCode, language: "en" | "fr" = "en") {
  void language;
  return LOCAL_CURRENCIES.has(currency) ? `1 ${currency} = 1 ${currency}` : "Exchange rate is not configured";
}
