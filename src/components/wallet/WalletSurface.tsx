import { easings } from "@/constants/motion";
import { WALLET_SCREENS, type WalletScreen } from "@/data/wallet-screens";
import { useEffect, useState } from "react";
import { useWindowDimensions, type ViewStyle } from "react-native";
import { View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

type WalletSurfaceProps = {
  screen: Exclude<WalletScreen, "HOME">;
  /** False starts the exit animation; `onClosed` fires when it finishes. */
  visible: boolean;
  onClosed: () => void;
  children: React.ReactNode;
};

/**
 * A Wallet "room" — one animated surface layered over Wallet Home.
 *
 * Performance model:
 * - Entry: slides in from below in 180ms
 * - Exit: immediately hides children (so the JS thread stops rendering the heavy
 *   FlatList/SVG content), then animates the empty shell off-screen in 120ms.
 *   This makes "return to Home" feel instant even on low-end devices.
 */
export function WalletSurface({
  screen,
  visible,
  onClosed,
  children,
}: WalletSurfaceProps) {
  const { height } = useWindowDimensions();

  const { origin, shellColor } = WALLET_SCREENS[screen];
  const enterFrom = origin === "below" ? height : -height;

  const translateY = useSharedValue(enterFrom);
  const opacity = useSharedValue(1);

  // When closing: immediately drop children from the tree so the JS thread
  // stops rendering the heavy surface content during the exit animation.
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    if (visible) {
      setShowContent(true);
      opacity.value = 1;
      translateY.value = withTiming(0, {
        duration: 180,
        easing: easings.out,
      });
      return;
    }

    // 1. Instantly hide children — frees the JS thread immediately
    setShowContent(false);

    // 2. Fade out the shell fast so the user sees Home right away
    opacity.value = withTiming(0, { duration: 80 });

    // 3. Slide the empty shell off-screen, then notify navigator
    translateY.value = withTiming(
      -height,
      { duration: 100, easing: easings.in },
      (finished) => {
        if (finished) runOnJS(onClosed)();
      }
    );
  }, [visible, height, translateY, opacity, onClosed]);

  const surfaceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const fill: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <Animated.View
      style={[fill, { backgroundColor: shellColor }, surfaceStyle]}
    >
      <View style={{ flex: 1 }}>
        {showContent ? children : null}
      </View>
    </Animated.View>
  );
}
