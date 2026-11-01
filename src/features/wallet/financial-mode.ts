import Constants from "expo-constants";

type FinancialRuntimeConfig = { EXPO_PUBLIC_FINANCIAL_SANDBOX?: string };

const configuredFlag =
  process.env.EXPO_PUBLIC_FINANCIAL_SANDBOX ??
  (Constants.expoConfig?.extra as FinancialRuntimeConfig | undefined)
    ?.EXPO_PUBLIC_FINANCIAL_SANDBOX;

/** Keeps demo money isolated from real, read-only Supabase wallet data. */
export const isFinancialSandboxEnabled =
  configuredFlag === undefined
    ? __DEV__
    : configuredFlag.trim().toLowerCase() !== "false";
