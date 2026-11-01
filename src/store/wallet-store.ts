import type { Wallet } from "@/types/wallet";
import { getWalletBalances } from "@/features/wallet/wallet-read-service";
import { isFinancialSandboxEnabled } from "@/features/wallet/financial-mode";
import { create } from "zustand";

export type DemoCardMovementDirection = "topup" | "withdraw";

type DemoCardMovementResult =
  | {
      ok: true;
      data: { walletBalance: number; cardBalance: number };
    }
  | { ok: false; error: string };

const DEMO_STARTING_BALANCE = 100;

type WalletState = {
  wallet: Wallet | null;
  /** Local-only virtual card balance used by the development sandbox. */
  demoCardBalance: number;
  isLoading: boolean;
  isBalanceHidden: boolean;
  loadWallet: (
    currency?: Wallet["currency"],
    getToken?: () => Promise<string | null>
  ) => Promise<void>;
  /** Used only by the development card sandbox; amounts are USD. */
  moveDemoCardFunds: (
    amount: string,
    direction: DemoCardMovementDirection
  ) => DemoCardMovementResult;
  applyConfirmedWalletBalance: (balance: number, currency?: Wallet["currency"]) => void;
  setEmptyWalletCurrency: (currency: Wallet["currency"]) => boolean;
  toggleBalanceVisibility: () => void;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  // The development card sandbox starts with the same $100 funding balance.
  // Production starts at zero until the real wallet backend is connected.
  wallet: isFinancialSandboxEnabled
    ? { balance: DEMO_STARTING_BALANCE, currency: "USD" }
    : null,
  demoCardBalance: 0,
  isLoading: false,
  isBalanceHidden: false,
  loadWallet: async (currency = "USD", getToken) => {
    if (isFinancialSandboxEnabled) return;
    if (!getToken) {
      set({ wallet: null });
      return;
    }

    set({ isLoading: true });
    try {
      const balances = await getWalletBalances(getToken);
      const selected = balances.find((item) => item.currency === currency);
      set({ wallet: selected ? { balance: selected.amount, currency } : null });
    } catch (error) {
      if (__DEV__) console.warn("[wallet] Could not load wallet balance:", error);
      set({ wallet: null });
    } finally {
      set({ isLoading: false });
    }
  },
  moveDemoCardFunds: (amount, direction) => {
    if (!isFinancialSandboxEnabled) {
      return { ok: false, error: "Demo card transfers are unavailable." };
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      return { ok: false, error: "Enter a valid amount." };
    }

    const cents = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      return { ok: false, error: "Enter a valid amount." };
    }

    const state = get();
    if (!state.wallet || state.wallet.currency !== "USD") {
      return { ok: false, error: "The demo card uses a USD wallet." };
    }

    const walletCents = Math.round(state.wallet.balance * 100);
    const cardCents = Math.round(state.demoCardBalance * 100);
    if (direction === "topup" && cents > walletCents) {
      return { ok: false, error: "Insufficient demo wallet balance." };
    }
    if (direction === "withdraw" && cents > cardCents) {
      return { ok: false, error: "Insufficient demo card balance." };
    }

    const nextWalletCents =
      direction === "topup" ? walletCents - cents : walletCents + cents;
    const nextCardCents =
      direction === "topup" ? cardCents + cents : cardCents - cents;
    const walletBalance = nextWalletCents / 100;
    const cardBalance = nextCardCents / 100;

    set({
      wallet: { ...state.wallet, balance: walletBalance },
      demoCardBalance: cardBalance,
    });

    return { ok: true, data: { walletBalance, cardBalance } };
  },
  applyConfirmedWalletBalance: (balance, currency = "USD") => {
    if (!Number.isFinite(balance) || balance < 0) return;
    set((state) => ({
      wallet: { ...(state.wallet ?? { balance: 0, currency }), balance, currency },
    }));
  },
  setEmptyWalletCurrency: (currency) => {
    let changed = false;
    set((state) => {
      if (!state.wallet || state.wallet.balance !== 0) return state;
      changed = true;
      return { wallet: { ...state.wallet, currency } };
    });
    return changed;
  },
  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceHidden: !state.isBalanceHidden })),
}));
