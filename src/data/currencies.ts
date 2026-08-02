import type { Currency, CurrencyCode } from "@/types/content";

/**
 * Supported currencies.
 *
 * Both initial markets (Benin and Côte d'Ivoire) transact in the West African
 * CFA franc (XOF), which has no minor unit in practice — amounts are whole
 * numbers. French-locale formatting: space thousands separator, symbol after
 * the amount (e.g. "12 500 FCFA").
 *
 * To add a currency later: add its code to `CurrencyCode` in
 * `types/content.ts`, then add an entry here.
 */
export const currencies: Record<CurrencyCode, Currency> = {
  XOF: {
    code: "XOF",
    symbol: "FCFA",
    name: "West African CFA franc",
    decimalDigits: 0,
    symbolPosition: "suffix",
    decimalSeparator: ",",
    thousandsSeparator: " ",
  },
};

/** The currency used when none is specified yet (both markets use XOF). */
export const defaultCurrencyCode: CurrencyCode = "XOF";

/** Look up a currency by its ISO code. */
export function getCurrency(code: CurrencyCode): Currency {
  return currencies[code];
}

/**
 * Format an amount according to a currency's display rules, e.g.
 * formatAmount(12500, "XOF") -> "12 500 FCFA".
 */
export function formatAmount(amount: number, code: CurrencyCode): string {
  const currency = currencies[code];

  const fixed = Math.abs(amount).toFixed(currency.decimalDigits);
  const [integerPart, decimalPart] = fixed.split(".");

  const groupedInteger = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    currency.thousandsSeparator
  );

  const number =
    decimalPart !== undefined
      ? `${groupedInteger}${currency.decimalSeparator}${decimalPart}`
      : groupedInteger;

  const sign = amount < 0 ? "-" : "";
  const withSymbol =
    currency.symbolPosition === "prefix"
      ? `${currency.symbol}${number}`
      : `${number} ${currency.symbol}`;

  return `${sign}${withSymbol}`;
}
