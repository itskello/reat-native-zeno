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

/**
 * Which mechanism animates the room in.
 *
 * `island` = the room IS the `islande model`: the Dynamic Island scales it up
 * from its own top-left corner and the two islands siphon into each other.
 * `surface` = the room is a plain layer above Home that travels vertically.
 *
 * Prefer `island`. A room on `surface` animates independently of the capsule,
 * which is what made earlier transitions read as disconnected screen pushes;
 * it stays only for rooms whose UI has not been built against the morph yet.
 */
export type SurfaceHost = "island" | "surface";

export type WalletScreenConfig = {
  /** Dynamic Island title while this room is open. */
  title: string;
  /** App Shell background — the light surface behind the hero block. */
  shellColor: string;
  origin: SurfaceOrigin;
  host: SurfaceHost;
  /**
   * Whether the Dynamic Island capsule is visible on this screen.
   * Set to false only for TRANSACTIONS — the one wallet room where the island
   * has no navigation role and would float awkwardly over the content.
   * All other rooms (HOME, CARD, SEND, GETPAID, ADD, WITHDRAW) show the island.
   */
  showIsland: boolean;
};

export const WALLET_SCREENS: Record<WalletScreen, WalletScreenConfig> = {
  HOME: {
    title: "Zeno Card",
    shellColor: colors.zenoBackground,
    origin: "below",
    host: "surface",
    showIsland: true,
  },
  CARD: {
    title: "Zeno Card",
    shellColor: colors.zenoCardShell,
    origin: "above",
    host: "island",
    showIsland: true,
  },
  SEND: {
    title: "Send Money",
    shellColor: colors.zenoSky,
    origin: "above",
    host: "island",
    showIsland: true,
  },
  GETPAID: {
    title: "Get Paid",
    shellColor: colors.zenoSky,
    origin: "above",
    host: "island",
    showIsland: true,
  },
  ADD: {
    title: "Add Money",
    shellColor: colors.zenoSky,
    origin: "below",
    host: "island",
    showIsland: true,
  },
  WITHDRAW: {
    title: "Withdraw Money",
    shellColor: colors.zenoSky,
    origin: "above",
    host: "island",
    showIsland: true,
  },
  TRANSACTIONS: {
    title: "Transactions",
    shellColor: colors.zenoSky,
    origin: "below",
    host: "surface",
    showIsland: false,
  },
};

/** True when the room is drawn and animated by the Dynamic Island itself. */
export const isIslandRoom = (screen: WalletScreen) =>
  WALLET_SCREENS[screen].host === "island";

