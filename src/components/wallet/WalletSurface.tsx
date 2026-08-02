import { durations, easings, gesture, springs } from "@/constants/motion";
import { WALLET_SCREENS, type WalletScreen } from "@/data/wallet-screens";
import { useWalletNav } from "@/store/wallet-nav";
import { useEffect } from "react";
import { useWindowDimensions, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
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
 * Motion model (AGENTS.md — Wallet Animation Rules): rooms travel vertically.
 * A feature surface rises from below the frame; the ZENO Card drops in from
 * above. Both leave upward, so the whole ecosystem reads as one continuous
 * vertical stack rather than a set of independent screen pushes.
 *
 * The surface owns its gesture and its transition; the screen it wraps owns
 * only its content. Swiping up past the distance or velocity threshold calls
 * `goHome()`; anything short of that springs back.
 */
export function WalletSurface({
  screen,
  visible,
  onClosed,
  children,
}: WalletSurfaceProps) {
  const { height } = useWindowDimensions();
  const goHome = useWalletNav((s) => s.goHome);
  const reduceMotion = useReducedMotion();

  const { origin, shellColor } = WALLET_SCREENS[screen];
  const enterFrom = origin === "below" ? height : -height;

  const translateY = useSharedValue(enterFrom);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate((event) => {
      const dy = event.translationY;
      // Upward drag tracks the finger; downward drag is damped, not blocked.
      translateY.value = dy < 0 ? dy : dy * gesture.overdragFactor;
    })
    .onEnd((event) => {
      const travelledUp = -event.translationY;
      const flickedUp = -event.velocityY;

      if (
        travelledUp > gesture.distanceThreshold ||
        flickedUp > gesture.velocityThreshold
      ) {
        runOnJS(goHome)();
        return;
      }

      translateY.value = reduceMotion
        ? withTiming(0, { duration: durations.cancel })
        : withSpring(0, springs.surface);
    });

  useEffect(() => {
    if (visible) {
      translateY.value = reduceMotion
        ? withTiming(0, { duration: durations.floating })
        : withSpring(0, springs.liquid);
      return;
    }

    // Rooms always exit upward — see the motion model above.
    translateY.value = withTiming(
      -height,
      { duration: durations.surface, easing: easings.out },
      (finished) => {
        if (finished) runOnJS(onClosed)();
      }
    );
  }, [visible, height, reduceMotion, translateY, onClosed]);

  const surfaceStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateY.value),
      [height, 0],
      [0, 1],
      "clamp"
    );
    const borderRadius = interpolate(progress, [0, 0.4, 1], [60, 36, 0], "clamp");
    const scale = interpolate(progress, [0, 1], [0.9, 1], "clamp");

    return {
      borderRadius,
      transform: [{ translateY: translateY.value }, { scale }],
    };
  });

  // Content settles in smoothly from center after liquid surface expands.
  const contentStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      Math.abs(translateY.value),
      [height * 0.4, 0],
      [0, 1],
      "clamp"
    );
    return {
      opacity: progress,
      transform: [
        { translateY: (1 - progress) * 20 },
        { scale: interpolate(progress, [0, 1], [0.94, 1], "clamp") },
      ],
    };
  });

  const fill: ViewStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[fill, { backgroundColor: shellColor }, surfaceStyle]}
      >
        <Animated.View style={[{ flex: 1 }, contentStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
