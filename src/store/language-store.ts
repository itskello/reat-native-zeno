import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";

export type AppLanguage = "en" | "fr";

const LANGUAGE_KEY = "zeno_app_language";

type LanguageState = {
  language: AppLanguage;
  hydrated: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  hydrate: () => Promise<void>;
};

async function readLanguage() {
  try {
    const value = Platform.OS === "web"
      ? localStorage.getItem(LANGUAGE_KEY)
      : await SecureStore.getItemAsync(LANGUAGE_KEY);
    return value === "en" || value === "fr" ? value : null;
  } catch {
    return null;
  }
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: "fr",
  hydrated: false,
  hydrate: async () => {
    const language = await readLanguage();
    set((state) => ({ language: language ?? state.language, hydrated: true }));
  },
  setLanguage: async (language) => {
    set({ language });
    try {
      if (Platform.OS === "web") localStorage.setItem(LANGUAGE_KEY, language);
      else await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    } catch {
      // Keep the current session responsive if device storage is unavailable.
    }
  },
}));
