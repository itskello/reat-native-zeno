import { findCountry } from "@/data/countries";
import type { CountryId, CurrencyCode, SupportedCountry } from "@/types/content";
import { create } from "zustand";

/**
 * App-wide client state: which market (country) the user is operating in, and
 * the currency that follows from it.
 *
 * NOTE ON PERSISTENCE: AGENTS.md describes persisting this via AsyncStorage,
 * but `@react-native-async-storage/async-storage` is not installed and new
 * dependencies need approval. For now the selection lives in memory and
 * defaults to Côte d'Ivoire. Wiring persistence (AsyncStorage or the
 * already-installed expo-secure-store) is a small follow-up once approved.
 */

const DEFAULT_COUNTRY_ID: CountryId = "cote-divoire";

type AppState = {
  selectedCountryId: CountryId;
  selectedCountry: SupportedCountry;
  selectedCurrency: CurrencyCode;
  setSelectedCountry: (id: CountryId) => void;
};

function resolve(id: CountryId): {
  selectedCountryId: CountryId;
  selectedCountry: SupportedCountry;
  selectedCurrency: CurrencyCode;
} {
  // findCountry only returns undefined for an unknown id; the default is known.
  const country = findCountry(id) ?? findCountry(DEFAULT_COUNTRY_ID)!;
  return {
    selectedCountryId: country.id,
    selectedCountry: country,
    selectedCurrency: country.defaultCurrency,
  };
}

export const useAppStore = create<AppState>((set) => ({
  ...resolve(DEFAULT_COUNTRY_ID),
  setSelectedCountry: (id) => set(resolve(id)),
}));
