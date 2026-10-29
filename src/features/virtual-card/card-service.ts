import { postAuthenticated } from "@/lib/api";
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
export const isCardSandboxEnabled = __DEV__;

let sandboxWalletCents = 10_000;
let sandboxCardCents = 0;
let sandboxCardStatus: VirtualCardStatus = "active";
const sandboxOperations = new Map<string, ReturnType<typeof sandboxResult>>();

function asMoney(cents: number) {
  return (cents / 100).toFixed(2);
}

function sandboxResult(amount: string, direction: "topup" | "withdraw") {
  const cents = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    return { ok: false as const, error: "Enter a valid amount." };
  }
  if (direction === "topup" && cents > sandboxWalletCents) {
    return { ok: false as const, error: "Insufficient demo wallet balance." };
  }
  if (direction === "withdraw" && cents > sandboxCardCents) {
    return { ok: false as const, error: "Insufficient demo card balance." };
  }

  if (direction === "topup") {
    sandboxWalletCents -= cents;
    sandboxCardCents += cents;
  } else {
    sandboxCardCents -= cents;
    sandboxWalletCents += cents;
  }

  return {
    ok: true as const,
    data: {
      cardBalance: asMoney(sandboxCardCents),
      walletBalance: sandboxWalletCents / 100,
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
      return Promise.resolve({
        ok: true as const,
        data: {
          balance: asMoney(sandboxCardCents),
          currency: "USD" as const,
          last4: "4242",
          status: sandboxCardStatus,
          fundingWalletBalance: asMoney(sandboxWalletCents),
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
