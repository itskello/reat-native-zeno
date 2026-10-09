import type {
  CountryId,
  MobileMoneyProvider,
  MobileMoneyProviderId,
} from "@/types/content";

/**
 * Mobile Money providers for the initial markets.
 *
 * - Benin: MTN Mobile Money, Moov Money, Celtiis
 * - Côte d'Ivoire: Orange Money, MTN Mobile Money, Moov Money
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
    availableIn: ["benin", "cote-divoire"],
  },
  {
    id: "moov",
    name: "Moov Money",
    logoKey: "moov",
    availableIn: ["benin", "cote-divoire"],
  },
  {
    id: "celtiis",
    name: "Celtiis",
    logoKey: "celtiis",
    availableIn: ["benin"],
  },
  {
    id: "orange",
    name: "Orange Money",
    availableIn: ["cote-divoire"],
  },
];

/** Providers available in a given country, in display order. */
export function getProvidersForCountry(
  countryId: CountryId
): MobileMoneyProvider[] {
  return mobileMoneyProviders.filter((provider) =>
    provider.availableIn.includes(countryId)
  );
}

/** Look up a provider by its id. */
export function getProvider(
  id: MobileMoneyProviderId
): MobileMoneyProvider | undefined {
  return mobileMoneyProviders.find((provider) => provider.id === id);
}
