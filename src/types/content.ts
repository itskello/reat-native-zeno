/**
 * ZENO reference / content data — shared types.
 *
 * This is the single source of truth for the *shapes* of ZENO's static
 * reference data (countries, currencies, Mobile Money providers, transaction
 * types). The actual values live in `src/data/*`. Keeping the types here — with
 * no imports from the data layer — lets every data file depend on these types
 * without creating circular imports.
 *
 * Everything here is designed to scale: adding a new country, currency, or
 * provider means adding a value in `src/data/*`, not changing these types.
 */

/** A local `require()` asset (number) or a remote image. */
export type ImageAsset = number | { uri: string };

/* -------------------------------------------------------------------------- */
/* Countries                                                                  */
/* -------------------------------------------------------------------------- */

/** Stable identifier for a supported country. Add new markets here. */
export type CountryId = "benin" | "cote-divoire" | "togo";

export type CountryIsoCode = "BEN" | "CIV" | "TGO";

/** KYC document types ZENO can accept for identity verification. */
export type KycDocumentType = "national_id" | "passport" | "drivers_license";

export type SupportedCountry = {
  id: CountryId;
  name: string;
  isoCode: CountryIsoCode;
  dialCode: string;
  /** Number of digits in the national number (excluding the dial code). */
  nationalNumberLength: number;
  /** Display mask used to format the number as the user types, "#" = one digit. */
  phoneFormat: string;
  flag: ImageAsset;
  /** Currency this country transacts in by default. */
  defaultCurrency: CurrencyCode;
  /** KYC document types accepted in this country, in display order. */
  kycDocuments: KycDocumentType[];
  /**
   * Not a market ZENO serves — only present so SMS verification can be tested
   * while the real markets are pending activation with the SMS provider.
   */
  isTestOnly?: boolean;
};

/* -------------------------------------------------------------------------- */
/* Currencies                                                                 */
/* -------------------------------------------------------------------------- */

/** ISO 4217 currency codes ZENO supports. Add new codes here. */
export type CurrencyCode = "XOF";

export type Currency = {
  code: CurrencyCode;
  /** Human-facing symbol, e.g. "FCFA". */
  symbol: string;
  /** Full currency name, e.g. "West African CFA franc". */
  name: string;
  /** Number of decimal places to display (XOF uses 0). */
  decimalDigits: number;
  /** Whether the symbol renders before or after the amount. */
  symbolPosition: "prefix" | "suffix";
  /** Separator between the integer and decimal parts. */
  decimalSeparator: string;
  /** Separator grouping thousands. */
  thousandsSeparator: string;
};

/* -------------------------------------------------------------------------- */
/* Mobile Money providers                                                     */
/* -------------------------------------------------------------------------- */

/** Stable identifier for a Mobile Money operator. Add new providers here. */
export type MobileMoneyProviderId = "mtn" | "moov" | "orange";

export type MobileMoneyProvider = {
  id: MobileMoneyProviderId;
  /** Display name, e.g. "MTN Mobile Money". */
  name: string;
  /**
   * Key into a future `images.providers` map (added once brand logos are
   * available). Kept as a string so no broken `require()` ships before the
   * assets exist — the UI resolves it to a real asset later.
   */
  logoKey: string;
  /** Countries where this provider is available. */
  availableIn: CountryId[];
};

/* -------------------------------------------------------------------------- */
/* Transaction types                                                          */
/* -------------------------------------------------------------------------- */

/** Every kind of financial movement shown in the transaction history. */
export type TransactionTypeId =
  | "sent"
  | "received"
  | "deposit"
  | "withdrawal"
  | "payment_request"
  | "card_payment"
  | "payment_link";

export type TransactionType = {
  id: TransactionTypeId;
  /** Short label shown in lists and details, e.g. "Received". */
  label: string;
  /**
   * Semantic icon key the UI maps to an icon component. Kept as a string so the
   * data layer stays free of UI dependencies.
   */
  iconKey: string;
  /**
   * Accent color for this type, taken from the ZENO design system
   * (see AGENTS.md — Design System). Green = money in, blue = primary action,
   * amber = caution / money out, dark = card / premium.
   */
  color: string;
};
