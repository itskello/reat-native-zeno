import { postAuthenticated } from "@/lib/api";
import { useWalletStore } from "@/store/wallet-store";
import { isFinancialSandboxEnabled } from "@/features/wallet/financial-mode";
import * as Crypto from "expo-crypto";

export type VirtualCardDetails = {
  cardholderName: string;
  number: string;
  expiry: string;
  cvc: string;
  last4: string;
};

export type VirtualCardStatus = "active" | "frozen";
export type VirtualCardOverview = {
  balance: string;
  currency: "USD";
  last4: string;
  status: VirtualCardStatus;
  /** Available balance in the development-only demo wallet. */
  fundingWalletBalance?: string;
};
export type CardBalanceResult = {
  cardBalance: string;
  walletBalance: number;
  transactionId: string;
};

/**
 * Development sandbox. It is intentionally in-memory and cannot move real
 * funds. Production always calls the authenticated server routes below.
 */
export const isCardSandboxEnabled = isFinancialSandboxEnabled;

let sandboxCardStatus: VirtualCardStatus = "active";
const sandboxOperations = new Map<string, ReturnType<typeof sandboxResult>>();

function asMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

function sandboxResult(amount: string, direction: "topup" | "withdraw") {
  const movement = useWalletStore
    .getState()
    .moveDemoCardFunds(amount, direction);
  if (!movement.ok) return movement;

  return {
    ok: true as const,
    data: {
      cardBalance: asMoney(Math.round(movement.data.cardBalance * 100)),
      walletBalance: movement.data.walletBalance,
      transactionId: `demo-${Crypto.randomUUID()}`,
    },
  };
}

function runSandboxTransfer(amount: string, direction: "topup" | "withdraw", key: string) {
  const existing = sandboxOperations.get(key);
  if (existing) return existing;
  const result = sandboxResult(amount, direction);
  sandboxOperations.set(key, result);
  return result;
}

/** Sensitive card data and card controls use authenticated server routes in production. */
export const virtualCardService = {
  getOverview(sessionToken: string) {
    if (isCardSandboxEnabled) {
      const { wallet, demoCardBalance } = useWalletStore.getState();
      return Promise.resolve({
        ok: true as const,
        data: {
          balance: asMoney(Math.round(demoCardBalance * 100)),
          currency: "USD" as const,
          last4: "4242",
          status: sandboxCardStatus,
          fundingWalletBalance: asMoney(Math.round((wallet?.balance ?? 0) * 100)),
        },
      });
    }
    return postAuthenticated<VirtualCardOverview>(
      "/api/cards/virtual/overview",
      sessionToken
    );
  },
  topUp(sessionToken: string, amount: string, idempotencyKey: string) {
    if (isCardSandboxEnabled) {
      return Promise.resolve(runSandboxTransfer(amount, "topup", idempotencyKey));
    }
    return postAuthenticated<CardBalanceResult>(
      "/api/cards/virtual/top-up",
      sessionToken,
      { amount, currency: "USD", idempotencyKey }
    );
  },
  transferToWallet(sessionToken: string, amount: string, idempotencyKey: string) {
    if (isCardSandboxEnabled) {
      return Promise.resolve(runSandboxTransfer(amount, "withdraw", idempotencyKey));
    }
    return postAuthenticated<CardBalanceResult>(
      "/api/cards/virtual/transfer-to-wallet",
      sessionToken,
      { amount, currency: "USD", idempotencyKey }
    );
  },
  getDetails(sessionToken: string) {
    if (isCardSandboxEnabled) {
      return Promise.resolve({
        ok: true as const,
        data: {
          cardholderName: "ZENO DEMO USER",
          number: "4242424242424242",
          expiry: "12/31",
          cvc: "123",
          last4: "4242",
        },
      });
    }
    return postAuthenticated<VirtualCardDetails>(
      "/api/cards/virtual/details",
      sessionToken
    );
  },
  getStatus(sessionToken: string) {
    if (isCardSandboxEnabled) {
      return Promise.resolve({ ok: true as const, data: { status: sandboxCardStatus } });
    }
    return postAuthenticated<{ status: VirtualCardStatus }>(
      "/api/cards/virtual/status",
      sessionToken
    );
  },
  freeze(sessionToken: string) {
    if (isCardSandboxEnabled) {
      sandboxCardStatus = "frozen";
      return Promise.resolve({ ok: true as const, data: { status: "frozen" as const } });
    }
    return postAuthenticated<{ status: "frozen" }>(
      "/api/cards/virtual/freeze",
      sessionToken
    );
  },
  unfreeze(sessionToken: string) {
    if (isCardSandboxEnabled) {
      sandboxCardStatus = "active";
      return Promise.resolve({ ok: true as const, data: { status: "active" as const } });
    }
    return postAuthenticated<{ status: "active" }>(
      "/api/cards/virtual/unfreeze",
      sessionToken
    );
  },
};
