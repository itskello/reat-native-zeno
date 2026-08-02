import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

const BIOMETRIC_ENABLED_KEY = "zeno_biometric_enabled";

// The PIN is stored per Clerk user so that multiple accounts on the same device
// never share an unlock code. The value is a hash, never the PIN itself.
const PIN_KEY_PREFIX = "zeno_pin_";

const pinStorageKey = (userId: string) => `${PIN_KEY_PREFIX}${userId}`;

type StoredPin = {
  /** Random per-PIN salt (hex) so identical PINs hash differently per account. */
  salt: string;
  /** SHA-256 of `salt + pin` (hex). The plaintext PIN is never persisted. */
  hash: string;
};

/**
 * Hash a PIN with its salt. SHA-256 is enough here because the PIN never leaves
 * the device and only gates local unlock — the backend stays the source of
 * truth for every financial action, and Clerk owns the real session.
 */
async function hashPin(salt: string, pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}${pin}`
  );
}

type SecurityState = {
  /**
   * Whether the user has enrolled and enabled biometric authentication.
   * - `true` = biometrics are active; the user completed enrollment
   * - `false` = explicitly disabled or skipped during onboarding
   * - `null` = not yet asked (pre-onboarding state)
   */
  biometricEnabled: boolean | null;
  /**
   * Whether the state has been loaded from SecureStore yet. Used to avoid
   * showing UI based on the default `null` before persistence is checked.
   */
  isLoaded: boolean;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  loadBiometricPreference: () => Promise<void>;
  /**
   * Persist the onboarding PIN for `userId`, salted and hashed. Called once the
   * user confirms their PIN during onboarding. Returns false if storage fails.
   */
  setPin: (userId: string, pin: string) => Promise<boolean>;
  /**
   * Check an entered PIN against the stored hash for `userId`. Returns true only
   * on an exact match. Returns false if no PIN was ever stored for that user.
   */
  verifyPin: (userId: string, pin: string) => Promise<boolean>;
  /** Whether a PIN has been stored for `userId`. */
  hasPin: (userId: string) => Promise<boolean>;
};

export const useSecurityStore = create<SecurityState>((set) => ({
  biometricEnabled: null,
  isLoaded: false,

  setBiometricEnabled: async (enabled: boolean) => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_ENABLED_KEY,
        enabled ? "true" : "false"
      );
      set({ biometricEnabled: enabled });
    } catch {
      // If persistence fails, keep the preference in memory only. The user
      // re-enrolls on the next launch, which is annoying but safe.
      set({ biometricEnabled: enabled });
    }
  },

  loadBiometricPreference: async () => {
    try {
      const stored = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      set({
        biometricEnabled: stored === "true" ? true : stored === "false" ? false : null,
        isLoaded: true,
      });
    } catch {
      // If SecureStore read fails, treat it as "never set" and leave it null.
      set({ biometricEnabled: null, isLoaded: true });
    }
  },

  setPin: async (userId: string, pin: string) => {
    try {
      const saltBytes = await Crypto.getRandomBytesAsync(16);
      const salt = Array.from(saltBytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const hash = await hashPin(salt, pin);

      const payload: StoredPin = { salt, hash };
      await SecureStore.setItemAsync(
        pinStorageKey(userId),
        JSON.stringify(payload)
      );
      return true;
    } catch {
      // Never fall back to plaintext or in-memory storage for the PIN: if we
      // cannot persist it securely, report failure so the caller can react.
      return false;
    }
  },

  verifyPin: async (userId: string, pin: string) => {
    try {
      const raw = await SecureStore.getItemAsync(pinStorageKey(userId));
      if (!raw) {
        return false;
      }

      const { salt, hash } = JSON.parse(raw) as StoredPin;
      const candidate = await hashPin(salt, pin);
      return candidate === hash;
    } catch {
      return false;
    }
  },

  hasPin: async (userId: string) => {
    try {
      const raw = await SecureStore.getItemAsync(pinStorageKey(userId));
      return raw !== null;
    } catch {
      return false;
    }
  },
}));
