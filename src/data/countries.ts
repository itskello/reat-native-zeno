import { images } from "@/constants/images";
import type { CountryId, SupportedCountry } from "@/types/content";

// Re-exported so existing `@/data/countries` imports keep working while the
// canonical type definitions live in the content types layer.
export type { CountryId, SupportedCountry } from "@/types/content";

export const supportedCountries: SupportedCountry[] = [
  {
    id: "benin",
    name: "Benin",
    isoCode: "BEN",
    dialCode: "+229",
    nationalNumberLength: 10,
    phoneFormat: "## ## ## ## ##",
    flag: images.flags.benin,
    defaultCurrency: "XOF",
    kycDocuments: ["national_id", "passport", "drivers_license"],
  },
  {
    id: "cote-divoire",
    name: "Côte d'Ivoire",
    isoCode: "CIV",
    dialCode: "+225",
    nationalNumberLength: 10,
    phoneFormat: "## ## ## ## ##",
    flag: images.flags.coteDIvoire,
    defaultCurrency: "XOF",
    kycDocuments: ["national_id", "passport", "drivers_license"],
  },
  {
    id: "togo",
    name: "Togo",
    isoCode: "TGO",
    dialCode: "+228",
    nationalNumberLength: 8,
    phoneFormat: "## ## ## ##",
    flag: images.flags.togo,
    defaultCurrency: "XOF",
    kycDocuments: ["national_id", "passport", "drivers_license"],
  },
];

/** Look up a supported country by its id. */
export function findCountry(id: CountryId): SupportedCountry | undefined {
  return supportedCountries.find((country) => country.id === id);
}

/**
 * Formats raw digits according to a country's phone mask, e.g.
 * formatPhoneNumber("90123456", "## ## ## ##") -> "90 12 34 56"
 */
export function formatPhoneNumber(rawDigits: string, phoneFormat: string) {
  const maxDigits = (phoneFormat.match(/#/g) ?? []).length;
  const digits = rawDigits.replace(/\D/g, "").slice(0, maxDigits);
  let digitIndex = 0;
  let result = "";

  for (const char of phoneFormat) {
    if (digitIndex >= digits.length) {
      break;
    }

    if (char === "#") {
      result += digits[digitIndex];
      digitIndex += 1;
    } else {
      result += char;
    }
  }

  return result;
}
