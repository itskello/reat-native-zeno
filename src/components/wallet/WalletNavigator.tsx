import { FloatingGlassNavBar } from "@/components/ui/FloatingGlassNavBar";
import { DynamicIsland } from "@/components/wallet/DynamicIsland";
import { FeatureStub } from "@/components/wallet/FeatureStub";
import { TransactionsSurface } from "@/components/wallet/TransactionsSurface";
import { WalletHomeSurface } from "@/components/wallet/WalletHomeSurface";
import { WalletSurface } from "@/components/wallet/WalletSurface";
import type { WalletScreen } from "@/data/wallet-screens";
import { isIslandRoom, WALLET_SCREENS } from "@/data/wallet-screens";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav, useWalletRoom } from "@/store/wallet-nav";
import { springs } from "@/constants/motion";
import { colors } from "@/theme/colors";
import { BackHandler, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import Animated, {
    interpolateColor,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSpring,
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
  const goHome = useWalletNav((s) => s.goHome);
  const clearClosing = useWalletNav((s) => s.clearClosing);

  const room = useWalletRoom();

  // Wallet rooms live inside one route. Keep Android Back inside that model:
  // close an open room/card first, and never reveal an old login route beneath
  // the authenticated wallet. At Wallet Home, Back exits the app normally.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (cardDragY.value > 1) {
            cardDragY.value = withSpring(0, springs.liquid);
            goHome();
            return true;
          }
          if (current !== "HOME") {
            goHome();
            return true;
          }
          BackHandler.exitApp();
          return true;
        }
      );

      return () => subscription.remove();
    }, [current, goHome])
  );
  const roomVisible = current !== "HOME";
  const surfaceRoom = room && !isIslandRoom(room) ? room : null;

  // Whether the Dynamic Island should be visible on the current screen
  const showIsland = WALLET_SCREENS[current].showIsland;
  const islandOpacity = useSharedValue(showIsland ? 1 : 0);

  // Animate island opacity when current screen changes
  const prevCurrent = useSharedValue(current);
  if (prevCurrent.value !== current) {
    prevCurrent.value = current;
    islandOpacity.value = withTiming(showIsland ? 1 : 0, { duration: 150 });
  }

  const islandStyle = useAnimatedStyle(() => ({
    opacity: islandOpacity.value,
    pointerEvents: islandOpacity.value < 0.1 ? "none" : "box-none",
  }));

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

  // Each room has its own colour family. For island rooms the shell follows the
  // drag rather than the room state, so the shell and the island morph together,
  // frame for frame.
  const shellColor = WALLET_SCREENS[room ?? "HOME"].shellColor;
  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      cardDragY.value,
      [0, 300],
      [colors.zenoBackground, shellColor]
    ),
  }));

  return (
    <Animated.View className="flex-1" style={shellStyle}>
      <WalletHomeSurface
        onScroll={onScroll}
        scrollY={scrollY}
        contentTopGap={contentTopGap}
        collapse={collapse}
      />

      {surfaceRoom && (
        <WalletSurface
          key={surfaceRoom}
          screen={surfaceRoom}
          visible={roomVisible}
          onClosed={clearClosing}
        >
          <RoomContent screen={surfaceRoom} contentTopGap={contentTopGap} />
        </WalletSurface>
      )}

      {/* Pinned Dynamic Island — fades out on screens where it has no role. */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          },
          islandStyle,
        ]}
      >
        <DynamicIsland collapse={collapse} liftDistance={ISLAND_HEIGHT / 2} />
      </Animated.View>

      {/* Floating Liquid Glass Navigation Bar (3 Main Tabs) */}
      {current !== "CARD" && <FloatingGlassNavBar />}
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
  if (screen === "TRANSACTIONS") {
    return <TransactionsSurface contentTopGap={contentTopGap} />;
  }

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
