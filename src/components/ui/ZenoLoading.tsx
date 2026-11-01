import loadingBlue from "../../../assets/logo loading animation/logo loading fond bleu.json";
import loadingLightBlue from "../../../assets/logo loading animation/logo loading fond bleur claire.json";
import loadingDarkGreen from "../../../assets/logo loading animation/logo loading fond vert somble.json";
import loadingGreen from "../../../assets/logo loading animation/logo loading fond vert.json";
import LottieView from "lottie-react-native";
import { useCallback, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

export type ZenoLoadingVariant = "blue" | "lightBlue" | "darkGreen" | "green";

const animations = {
  blue: loadingBlue,
  lightBlue: loadingLightBlue,
  darkGreen: loadingDarkGreen,
  green: loadingGreen,
};

type ZenoLoadingProps = {
  variant?: ZenoLoadingVariant;
  size?: number;
  className?: string;
  color?: string;
};

export function ZenoLoading({
  variant = "blue",
  size = 104,
  className = "",
  color = "#0057FF",
}: ZenoLoadingProps) {
  const animationRef = useRef<LottieView | null>(null);
  const isPlayingReverse = useRef(false);

  const startAnimation = useCallback(() => {
    isPlayingReverse.current = false;
    animationRef.current?.play(0, 300);
  }, []);

  const continueAnimation = useCallback((isCancelled: boolean) => {
    if (isCancelled) return;

    const playReverse = !isPlayingReverse.current;
    isPlayingReverse.current = playReverse;
    animationRef.current?.play(playReverse ? 300 : 0, playReverse ? 0 : 300);
  }, []);
  const spinnerColor = color !== "#0057FF"
    ? color
    : variant === "green"
      ? "#0A1712"
      : variant === "darkGreen"
        ? "#C7FF4A"
        : "#0057FF";

  // Reserve the animated brand mark for actual screen-level waits. Compact
  // inline states (buttons, search, and list refreshes) use a quiet native spinner.
  if (size <= 32 || Platform.OS === "web") {
    return (
      <View className={`items-center justify-center ${className}`}>
        <ActivityIndicator size={size <= 32 ? "small" : "large"} color={spinnerColor} />
      </View>
    );
  }

  return (
    <View className={`items-center justify-center ${className}`} accessible accessibilityLabel="ZENO loading">
      <LottieView
        ref={animationRef}
        source={animations[variant]}
        autoPlay={false}
        loop={false}
        onAnimationLoaded={startAnimation}
        onAnimationFinish={continueAnimation}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
