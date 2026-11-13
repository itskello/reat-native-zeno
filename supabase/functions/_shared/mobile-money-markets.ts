/** Server-side market and provider routing. The app's selection is never trusted. */
export type MobileMoneyMarketId =
  | "benin" | "cote-divoire" | "senegal" | "burkina-faso" | "mali" | "togo"
  | "ghana" | "nigeria" | "cameroon" | "democratic-republic-of-congo";

export type LocalMoneyOperatorId =
  | "mtn" | "moov" | "celtiis" | "orange" | "wave" | "free" | "expresso"
  | "wizall" | "mixx" | "tmoney" | "telecel" | "airteltigo" | "airtel" | "vodacom-mpesa" | "djamo";

type Market = {
  iso3: string;
  dialCode: string;
  nationalDigits: number;
  currency: "XOF" | "GHS" | "NGN" | "XAF" | "CDF";
  operators: Partial<Record<LocalMoneyOperatorId, { name: string; provider: "paydunya" | "pawapay"; pawaNames?: string[] }>>;
};

export const MOBILE_MONEY_MARKETS: Record<MobileMoneyMarketId, Market> = {
  benin: { iso3: "BEN", dialCode: "229", nationalDigits: 8, currency: "XOF", operators: {
    mtn: { name: "MTN Money", provider: "pawapay", pawaNames: ["MTN"] },
    moov: { name: "Moov Money", provider: "paydunya", pawaNames: ["Moov"] },
    celtiis: { name: "Celtiis", provider: "paydunya" },
  } },
  "cote-divoire": { iso3: "CIV", dialCode: "225", nationalDigits: 10, currency: "XOF", operators: {
    mtn: { name: "MTN Money", provider: "paydunya", pawaNames: ["MTN"] },
    moov: { name: "Moov Money", provider: "paydunya", pawaNames: ["Moov"] },
    orange: { name: "Orange Money", provider: "paydunya", pawaNames: ["Orange"] },
    wave: { name: "Wave", provider: "paydunya" },
    djamo: { name: "Djamo", provider: "paydunya" },
  } },
  senegal: { iso3: "SEN", dialCode: "221", nationalDigits: 9, currency: "XOF", operators: {
    orange: { name: "Orange Money", provider: "paydunya", pawaNames: ["Orange"] },
    free: { name: "Free Money", provider: "paydunya" },
    expresso: { name: "Expresso", provider: "paydunya" },
    wave: { name: "Wave", provider: "paydunya" },
    djamo: { name: "Djamo", provider: "paydunya" },
    mixx: { name: "Mixx", provider: "pawapay", pawaNames: ["Mixx"] },
  } },
  "burkina-faso": { iso3: "BFA", dialCode: "226", nationalDigits: 8, currency: "XOF", operators: {
    orange: { name: "Orange Money", provider: "paydunya", pawaNames: ["Orange"] },
    moov: { name: "Moov Money", provider: "paydunya", pawaNames: ["Moov"] },
  } },
  mali: { iso3: "MLI", dialCode: "223", nationalDigits: 8, currency: "XOF", operators: {
    orange: { name: "Orange Money", provider: "paydunya", pawaNames: ["Orange"] },
    moov: { name: "Moov Money", provider: "pawapay", pawaNames: ["Moov"] },
    wave: { name: "Wave", provider: "pawapay", pawaNames: ["Wave"] },
  } },
  togo: { iso3: "TGO", dialCode: "228", nationalDigits: 8, currency: "XOF", operators: {
    tmoney: { name: "T-Money", provider: "paydunya" },
    moov: { name: "Moov Money", provider: "paydunya" },
  } },
  ghana: { iso3: "GHA", dialCode: "233", nationalDigits: 9, currency: "GHS", operators: {
    mtn: { name: "MTN Mobile Money", provider: "pawapay", pawaNames: ["MTN"] },
    telecel: { name: "Telecel Cash", provider: "pawapay", pawaNames: ["Telecel"] },
    airteltigo: { name: "AirtelTigo", provider: "pawapay", pawaNames: ["AirtelTigo", "AT"] },
  } },
  nigeria: { iso3: "NGA", dialCode: "234", nationalDigits: 10, currency: "NGN", operators: {
    mtn: { name: "MTN MoMo", provider: "pawapay", pawaNames: ["MTN"] },
    airtel: { name: "Airtel Money", provider: "pawapay", pawaNames: ["Airtel"] },
  } },
  cameroon: { iso3: "CMR", dialCode: "237", nationalDigits: 9, currency: "XAF", operators: {
    mtn: { name: "MTN Mobile Money", provider: "paydunya" },
    orange: { name: "Orange Money", provider: "pawapay", pawaNames: ["Orange"] },
  } },
  "democratic-republic-of-congo": { iso3: "COD", dialCode: "243", nationalDigits: 9, currency: "CDF", operators: {
    airtel: { name: "Airtel Money", provider: "pawapay", pawaNames: ["Airtel"] },
    orange: { name: "Orange Money", provider: "pawapay", pawaNames: ["Orange"] },
    "vodacom-mpesa": { name: "Vodacom M-Pesa", provider: "pawapay", pawaNames: ["Vodacom", "M-Pesa"] },
  } },
};

export function parseMobileMoneyMarket(value: unknown): MobileMoneyMarketId | null {
  return typeof value === "string" && value in MOBILE_MONEY_MARKETS ? value as MobileMoneyMarketId : null;
}

export function getMobileMoneyRoute(countryId: MobileMoneyMarketId, operatorId: string) {
  const market = MOBILE_MONEY_MARKETS[countryId];
  const operator = market.operators[operatorId as LocalMoneyOperatorId];
  return operator ? { market, operatorId: operatorId as LocalMoneyOperatorId, ...operator } : null;
}

/** Resolve the provider code from the merchant's own active configuration. */
export function resolvePawaPayProvider(
  activeConfiguration: Record<string, unknown>,
  countryId: MobileMoneyMarketId,
  operatorId: string,
  operation: "DEPOSIT" | "PAYOUT",
) {
  const route = getMobileMoneyRoute(countryId, operatorId);
  if (!route || route.provider !== "pawapay" || !route.pawaNames?.length) return null;
  const countries = Array.isArray(activeConfiguration.countries) ? activeConfiguration.countries : [];
  const country = countries.find((item) => isRecord(item) && item.country === route.market.iso3);
  if (!isRecord(country) || !Array.isArray(country.providers)) return null;
  const wantedNames = route.pawaNames.map(normalizeName);

  for (const provider of country.providers) {
    if (!isRecord(provider) || typeof provider.provider !== "string" || typeof provider.displayName !== "string") continue;
    const actualName = normalizeName(provider.displayName);
    if (!wantedNames.some((name) => actualName === name || actualName.includes(name))) continue;
    if (!Array.isArray(provider.currencies)) continue;
    const currency = provider.currencies.find((entry) => isRecord(entry) && entry.currency === route.market.currency);
    if (!isRecord(currency) || !Array.isArray(currency.operationTypes)) continue;
    const isOperational = currency.operationTypes.some((entry) => {
      if (!isRecord(entry)) return false;
      const nested = isRecord(entry[operation]) ? entry[operation] : null;
      const operationType = entry.operationType === operation ? entry : nested;
      return isRecord(operationType) && operationType.status === "OPERATIONAL";
    });
    if (isOperational) return { provider: provider.provider, market: route.market, name: route.name };
  }
  return null;
}

export function normalizeLocalPhone(countryId: MobileMoneyMarketId, input: string) {
  const market = MOBILE_MONEY_MARKETS[countryId];
  const digits = input.replace(/\D/g, "");
  const national = digits.length === market.nationalDigits + market.dialCode.length && digits.startsWith(market.dialCode)
    ? digits.slice(market.dialCode.length)
    : digits;
  return /^\d+$/.test(national) && national.length === market.nationalDigits
    ? { national, e164: `${market.dialCode}${national}` }
    : null;
}

export function localCurrencyMinorUnits(currency: Market["currency"]) {
  return currency === "XOF" || currency === "XAF" ? 0 : 2;
}

export function minorToProviderAmount(amountMinor: number, currency: Market["currency"]) {
  const digits = localCurrencyMinorUnits(currency);
  if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error("Invalid Mobile Money amount.");
  if (digits === 0) return String(amountMinor);
  const whole = Math.floor(amountMinor / 100);
  const fractional = String(amountMinor % 100).padStart(2, "0");
  return `${whole}.${fractional}`;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
