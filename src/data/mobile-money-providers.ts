import type {
  CountryId,
  MobileMoneyProvider,
  MobileMoneyProviderId,
} from "@/types/content";

/**
 * Mobile Money providers for the initial markets.
 *
 * - Benin: MTN Mobile Money, Moov Money
 * - Côte d'Ivoire: Orange Money, MTN Mobile Money, Moov Money
 *
 * `logoKey` is a placeholder key into a future `images.providers` map — brand
 * logos are added to `constants/images.ts` once available, so nothing ships a
 * broken `require()` today.
 *
 * To add a provider or extend one to a new country: add/adjust an entry here
 * (and its id in `types/content.ts`). No consumer code needs to change.
 */
export const mobileMoneyProviders: MobileMoneyProvider[] = [
  {
    id: "mtn",
    name: "MTN Mobile Money",
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
    id: "orange",
    name: "Orange Money",
    logoKey: "orange",
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
