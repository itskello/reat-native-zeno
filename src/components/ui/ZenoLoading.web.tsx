import { ActivityIndicator, View } from "react-native";

export type ZenoLoadingVariant = "blue" | "lightBlue" | "darkGreen" | "green";

type ZenoLoadingProps = {
  variant?: ZenoLoadingVariant;
  size?: number;
  className?: string;
  color?: string;
};

/** Web keeps the same quiet system spinner without importing native Lottie. */
export function ZenoLoading({
  variant = "blue",
  size = 104,
  className = "",
  color = "#0057FF",
}: ZenoLoadingProps) {
  const spinnerColor = color !== "#0057FF"
    ? color
    : variant === "green"
      ? "#0A1712"
      : variant === "darkGreen"
        ? "#C7FF4A"
        : "#0057FF";

  return (
    <View
      className={`items-center justify-center ${className}`}
      accessible
      accessibilityLabel="ZENO loading"
    >
      <ActivityIndicator
        size={size <= 32 ? "small" : "large"}
        color={spinnerColor}
      />
    </View>
  );
}
