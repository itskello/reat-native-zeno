import type {
  CountryId,
  MobileMoneyProvider,
  MobileMoneyProviderId,
} from "@/types/content";

/**
 * Mobile Money provider choices for the ten proposed launch markets.
 *
 * Provider activation is still confirmed against each merchant's server-side
 * pawaPay active configuration and PayDunya account credentials.
 *
 * `logoKey` points into `images.providers`. Orange has no bundled brand mark
 * yet, so it is omitted rather than pointing at a missing asset.
 *
 * To add a provider or extend one to a new country: add/adjust an entry here
 * (and its id in `types/content.ts`). No consumer code needs to change.
 */
export const mobileMoneyProviders: MobileMoneyProvider[] = [
  {
    id: "mtn",
    name: "MTN Money",
    logoKey: "mtn",
    availableIn: ["benin", "cote-divoire", "cameroon", "ghana", "nigeria"],
    payoutAvailableIn: ["benin", "cote-divoire", "cameroon", "ghana", "nigeria"],
  },
  {
    id: "moov",
    name: "Moov Money",
    logoKey: "moov",
    availableIn: ["benin", "cote-divoire", "burkina-faso", "mali", "togo"],
    payoutAvailableIn: ["benin", "cote-divoire", "burkina-faso", "mali", "togo"],
  },
  {
    id: "celtiis",
    name: "Celtiis",
    logoKey: "celtiis",
    availableIn: ["benin"],
    payoutAvailableIn: ["benin"],
  },
  {
    id: "orange",
    name: "Orange Money",
    availableIn: ["cote-divoire", "senegal", "burkina-faso", "mali"],
    payoutAvailableIn: ["cote-divoire", "senegal", "burkina-faso", "mali"],
  },
  { id: "wave", name: "Wave", availableIn: ["cote-divoire", "senegal", "mali"], payoutAvailableIn: ["cote-divoire", "senegal"] },
  { id: "free", name: "Free Money", availableIn: ["senegal"], payoutAvailableIn: ["senegal"] },
  { id: "expresso", name: "Expresso", availableIn: ["senegal"], payoutAvailableIn: ["senegal"] },
  { id: "mixx", name: "Mixx", availableIn: ["senegal"], payoutAvailableIn: ["senegal"] },
  { id: "djamo", name: "Djamo", availableIn: ["cote-divoire", "senegal"], payoutAvailableIn: ["cote-divoire", "senegal"] },
  { id: "tmoney", name: "T-Money", availableIn: ["togo"], payoutAvailableIn: ["togo"] },
  { id: "telecel", name: "Telecel Cash", availableIn: ["ghana"], payoutAvailableIn: ["ghana"] },
  { id: "airteltigo", name: "AirtelTigo", availableIn: ["ghana"], payoutAvailableIn: ["ghana"] },
  { id: "airtel", name: "Airtel Money", availableIn: ["nigeria", "democratic-republic-of-congo"], payoutAvailableIn: ["nigeria", "democratic-republic-of-congo"] },
  { id: "vodacom-mpesa", name: "Vodacom M-Pesa", availableIn: ["democratic-republic-of-congo"], payoutAvailableIn: ["democratic-republic-of-congo"] },
];

/** Providers available in a given country, in display order. */
export function getProvidersForCountry(
  countryId: CountryId,
  operation: "deposit" | "withdrawal" = "deposit",
): MobileMoneyProvider[] {
  return mobileMoneyProviders.filter((provider) =>
    operation === "deposit"
      ? provider.availableIn.includes(countryId)
      : provider.payoutAvailableIn?.includes(countryId) === true
  );
}

/** Look up a provider by its id. */
export function getProvider(
  id: MobileMoneyProviderId
): MobileMoneyProvider | undefined {
  return mobileMoneyProviders.find((provider) => provider.id === id);
}
