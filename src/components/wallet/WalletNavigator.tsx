import { DynamicIsland } from "@/components/wallet/DynamicIsland";
import { FeatureStub } from "@/components/wallet/FeatureStub";
import { WalletHomeSurface } from "@/components/wallet/WalletHomeSurface";
import { WalletSurface } from "@/components/wallet/WalletSurface";
import type { WalletScreen } from "@/data/wallet-screens";
import { useWalletNav, useWalletRoom } from "@/store/wallet-nav";
import { cardDragY } from "@/store/wallet-gesture";
import { colors } from "@/theme/colors";
import { View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Vertical room left for the pill before Wallet Home content starts. */
const ISLAND_HEIGHT = 54;
const COLLAPSE_RANGE = 90;

/**
 * The Wallet ecosystem shell.
 *
 * Wallet Home is always mounted at the base; the room selected in the
 * navigation store is layered on top and animated in by `WalletSurface`. The
 * Dynamic Island sits above everything, pinned at camera level, and never
 * unmounts — that is what makes a room change feel like moving inside one
 * space instead of pushing a new screen.
 */
export function WalletNavigator() {
  const insets = useSafeAreaInsets();
  const current = useWalletNav((s) => s.current);
  const clearClosing = useWalletNav((s) => s.clearClosing);

  // The room stays mounted while it plays its exit animation (the store keeps
  // it in `closing`), so the collapse is visible instead of the surface
  // vanishing on state change.
  const room = useWalletRoom();
  const roomVisible = current !== "HOME";

  const islandTop = Math.max(insets.top - ISLAND_HEIGHT / 2, 6);
  const contentTopGap = islandTop + ISLAND_HEIGHT + 24;

  const collapse = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    collapse.value = Math.min(
      Math.max(event.contentOffset.y / COLLAPSE_RANGE, 0),
      1
    );
  });

  // Each room has its own colour family; the shell behind the ZENO Card is the
  // light green one. It follows the drag rather than the room state so the
  // shell and the island morph together, frame for frame.
  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cardDragY.value,
      [0, 300],
      [colors.zenoBackground, colors.zenoCardShell]
    ),
  }));

  return (
    <Animated.View className="flex-1" style={shellStyle}>
      <WalletHomeSurface
        onScroll={onScroll}
        scrollY={scrollY}
        contentTopGap={contentTopGap}
      />

      {room && room !== "CARD" && (
        <WalletSurface
          key={room}
          screen={room}
          visible={roomVisible}
          onClosed={clearClosing}
        >
          <RoomContent screen={room} contentTopGap={contentTopGap} />
        </WalletSurface>
      )}

      {/* Pinned Dynamic Island — above every room, never remounted. Its own
          geometry is absolute (from the Lottie canvas), so this layer covers
          the whole screen and does no positioning of its own. */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <DynamicIsland collapse={collapse} liftDistance={ISLAND_HEIGHT / 2} />
      </View>
    </Animated.View>
  );
}

/**
 * Room content. Each feature replaces its stub here as it gets built — the
 * transition, gesture and Dynamic Island behaviour come from the navigator, so
 * a feature only ever contributes its own UI.
 *
 * CARD is never routed here: the ZENO Card is drawn by the Dynamic Island
 * itself, because it is one of the two islands rather than a room above Home.
 */
function RoomContent({
  screen,
  contentTopGap,
}: {
  screen: Exclude<WalletScreen, "HOME">;
  contentTopGap: number;
}) {
  const subtitles: Record<Exclude<WalletScreen, "HOME">, string> = {
    CARD: "Your ZENO virtual card, drawn from your wallet balance.",
    SEND: "Send to a ZENO user or Mobile Money account.",
    GETPAID: "Create a payment link, request money, or share your QR code.",
    ADD: "Top up your wallet from Mobile Money.",
    WITHDRAW: "Cash out to your Mobile Money account.",
    TRANSACTIONS: "Your full financial activity.",
  };

  return (
    <FeatureStub subtitle={subtitles[screen]} contentTopGap={contentTopGap} />
  );
}
