import { View } from "react-native";

type BellIconProps = {
  size?: number;
  color?: string;
};

/**
 * Notification bell built from a rounded body, a top nub, and a bottom
 * clapper. Static UI only — no notification logic yet. Matches the project's
 * hand-drawn icon convention (no SVG/icon library is installed).
 */
export function BellIcon({ size = 24, color = "#0057FF" }: BellIconProps) {
  const thickness = size * 0.09;
  const bodyWidth = size * 0.66;
  const bodyHeight = size * 0.58;

  return (
    <View style={{ width: size, height: size, alignItems: "center" }}>
      {/* Top nub. */}
      <View
        style={{
          width: thickness * 1.6,
          height: thickness * 1.6,
          borderRadius: thickness,
          backgroundColor: color,
          marginTop: size * 0.08,
        }}
      />
      {/* Bell body: rounded top, straight sides. */}
      <View
        style={{
          width: bodyWidth,
          height: bodyHeight,
          borderWidth: thickness,
          borderColor: color,
          borderTopLeftRadius: bodyWidth / 2,
          borderTopRightRadius: bodyWidth / 2,
          borderBottomLeftRadius: size * 0.08,
          borderBottomRightRadius: size * 0.08,
          marginTop: -thickness,
        }}
      />
      {/* Rim. */}
      <View
        style={{
          width: bodyWidth * 1.28,
          height: thickness,
          borderRadius: thickness,
          backgroundColor: color,
          marginTop: -thickness / 2,
        }}
      />
      {/* Clapper. */}
      <View
        style={{
          width: thickness * 2.2,
          height: thickness * 2.2,
          borderRadius: thickness * 1.1,
          backgroundColor: color,
          marginTop: thickness * 0.3,
        }}
      />
    </View>
  );
}
