import { WALLET_SCREENS, type WalletScreen } from "@/data/wallet-screens";
import { create } from "zustand";

/**
 * Wallet navigation controller.
 *
 * The Wallet does not use a route stack — it is a single screen containing
 * vertically stacked "rooms". Screens never manage their own transitions:
 * they call `navigateTo` / `goHome`, and the animated surfaces react to this
 * store (AGENTS.md — Wallet navigation is centrally controlled).
 *
 * The Dynamic Island title is part of this store on purpose: it must change
 * BEFORE the transition starts, so it is derived from `current`, not animated
 * alongside the surface.
 */

type WalletRoom = Exclude<WalletScreen, "HOME">;

type WalletNavState = {
  current: WalletScreen;
  /**
   * The room that is playing its exit animation after a return Home. It stays
   * set — and therefore mounted — until the surface reports the collapse is
   * finished via `clearClosing`.
   */
  closing: WalletRoom | null;
  navigateTo: (screen: WalletScreen) => void;
  goHome: () => void;
  clearClosing: () => void;
};

export const useWalletNav = create<WalletNavState>((set) => ({
  current: "HOME",
  closing: null,
  navigateTo: (screen) =>
    set((state) =>
      state.current === screen
        ? state
        : { current: screen, closing: screen === "HOME" ? state.closing : null }
    ),
  goHome: () =>
    set((state) =>
      state.current === "HOME"
        ? state
        : { current: "HOME", closing: state.current as WalletRoom }
    ),
  clearClosing: () => set({ closing: null }),
}));

/** The room to render above Wallet Home: the open one, or the one closing. */
export const useWalletRoom = (): WalletRoom | null =>
  useWalletNav((s) => (s.current === "HOME" ? s.closing : (s.current as WalletRoom)));

/** Dynamic Island title for the room currently open. */
export const useWalletIslandTitle = () =>
  useWalletNav((s) => WALLET_SCREENS[s.current].title);
