import { WalletNavigator } from "@/components/wallet/WalletNavigator";

/**
 * The Wallet route.
 *
 * The whole Wallet ecosystem lives behind this single route: its features are
 * vertically stacked "rooms" inside `WalletNavigator`, not separate routes
 * (AGENTS.md — Wallet navigation is centrally controlled).
 */
export default function WalletScreen() {
  return <WalletNavigator />;
}
