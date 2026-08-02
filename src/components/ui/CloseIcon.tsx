import { View } from "react-native";

type CloseIconProps = {
  size?: number;
  color?: string;
  thickness?: number;
};

/**
 * A dismiss cross — two bars crossed at right angles. Matches the project's
 * hand-drawn icon convention (no SVG/icon library is installed).
 */
export function CloseIcon({
  size = 24,
  color = "#FFFFFF",
  thickness = 2.4,
}: CloseIconProps) {
  const bar = {
    position: "absolute" as const,
    top: size / 2 - thickness / 2,
    left: 0,
    width: size,
    height: thickness,
    borderRadius: thickness,
    backgroundColor: color,
  };

  return (
    <View style={{ width: size, height: size }}>
      <View style={[bar, { transform: [{ rotate: "45deg" }] }]} />
      <View style={[bar, { transform: [{ rotate: "-45deg" }] }]} />
    </View>
  );
}
