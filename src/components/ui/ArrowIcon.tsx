import { View } from "react-native";

type ArrowIconProps = {
  size?: number;
  color?: string;
  thickness?: number;
  /** Direction the arrow head points. */
  direction?: "up-right" | "down-right" | "up-left" | "down-left";
};

const ROTATION: Record<NonNullable<ArrowIconProps["direction"]>, string> = {
  "up-right": "0deg",
  "down-right": "90deg",
  "down-left": "180deg",
  "up-left": "270deg",
};

/**
 * Diagonal arrow built from a shaft + a two-sided head, rotated to point in one
 * of the four diagonal directions. Matches the project's hand-drawn icon
 * convention (no SVG/icon library is installed).
 */
export function ArrowIcon({
  size = 22,
  color = "#0057FF",
  thickness = 2.4,
  direction = "up-right",
}: ArrowIconProps) {
  const head = size * 0.5;

  return (
    <View
      style={{
        width: size,
        height: size,
        transform: [{ rotate: ROTATION[direction] }],
      }}
    >
      {/* Diagonal shaft (bottom-left → top-right). */}
      <View
        style={{
          position: "absolute",
          top: size / 2 - thickness / 2,
          left: -size * 0.12,
          width: size * 1.24,
          height: thickness,
          borderRadius: thickness,
          backgroundColor: color,
          transform: [{ rotate: "-45deg" }],
        }}
      />
      {/* Arrow head: top and right edges of a corner. */}
      <View
        style={{
          position: "absolute",
          top: size * 0.16,
          right: size * 0.16,
          width: head,
          height: thickness,
          borderRadius: thickness,
          backgroundColor: color,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: size * 0.16,
          right: size * 0.16,
          width: thickness,
          height: head,
          borderRadius: thickness,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
