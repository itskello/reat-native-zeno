import { colors } from "@/theme/colors";

/**
 * The Wallet ecosystem is a vertical stack of "rooms", not a route stack.
 * This file describes those rooms: their Dynamic Island title, their color
 * family, and the direction they enter from. The navigation store and the
 * animated surfaces both read from here, so adding a feature means adding one
 * entry — not touching the animation code.
 */

export type WalletScreen =
  | "HOME"
  | "CARD"
  | "SEND"
  | "GETPAID"
  | "ADD"
  | "WITHDRAW"
  | "TRANSACTIONS";

/**
 * Where a room lives relative to Home.
 * `below` = it sits under Home and rises up when opened (feature surfaces).
 * `above` = it sits over Home and drops down when opened (ZENO Card).
 */
export type SurfaceOrigin = "above" | "below";

export type WalletScreenConfig = {
  /** Dynamic Island title while this room is open. */
  title: string;
  /** App Shell background — the light surface behind the hero block. */
  shellColor: string;
  origin: SurfaceOrigin;
};

export const WALLET_SCREENS: Record<WalletScreen, WalletScreenConfig> = {
  HOME: {
    title: "Zeno Card",
    shellColor: colors.zenoBackground,
    origin: "below",
  },
  CARD: {
    title: "Zeno Card",
    shellColor: colors.zenoIntro,
    origin: "above",
  },
  SEND: {
    title: "Send Money",
    shellColor: colors.zenoSky,
    origin: "below",
  },
  GETPAID: {
    title: "Get Paid",
    shellColor: colors.zenoSky,
    origin: "below",
  },
  ADD: {
    title: "Add Money",
    shellColor: colors.zenoSky,
    origin: "below",
  },
  WITHDRAW: {
    title: "Withdraw",
    shellColor: colors.zenoSky,
    origin: "below",
  },
  TRANSACTIONS: {
    title: "Transactions",
    shellColor: colors.zenoSky,
    origin: "below",
  },
};
