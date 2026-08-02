import * as SecureStore from "expo-secure-store";

/**
 * Clerk persists its session token here. SecureStore is backed by the iOS
 * Keychain / Android Keystore, so the token never lands in plain AsyncStorage.
 */
export const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      await SecureStore.deleteItemAsync(key).catch(() => {});
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore: a failed write only means the user re-authenticates next launch.
    }
  },
};
