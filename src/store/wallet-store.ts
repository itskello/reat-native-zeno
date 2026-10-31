import type { Wallet } from "@/types/wallet";
import { create } from "zustand";

/**
 * Wallet display state.
 *
 * The balance here is PLACEHOLDER data so the UI can be built and reviewed.
 * The backend is the source of truth for the real balance (see AGENTS.md —
 * Financial Data Rules); `loadWallet` is where the real fetch is wired later.
 * The screen must never hardcode a balance — it reads from this store.
 */

const PLACEHOLDER_WALLET: Wallet = {
  balance: 0,
  currency: "USD",
};

type WalletState = {
  wallet: Wallet | null;
  isLoading: boolean;
  /** Whether the balance is masked behind the eye toggle. */
  isBalanceHidden: boolean;
  loadWallet: () => Promise<void>;
  /** Change the demo wallet denomination only while its balance is zero. */
  setEmptyWalletCurrency: (currency: Wallet["currency"]) => boolean;
  toggleBalanceVisibility: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  wallet: PLACEHOLDER_WALLET,
  isLoading: false,
  isBalanceHidden: false,
  loadWallet: async () => {
    set({ isLoading: true });
    // TODO: fetch the real balance from the backend and set it here.
    set({ wallet: PLACEHOLDER_WALLET, isLoading: false });
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
