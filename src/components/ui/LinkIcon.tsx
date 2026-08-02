import { View } from "react-native";

type LinkIconProps = {
  size?: number;
  color?: string;
};

/**
 * Chain-link glyph: two rounded capsule outlines overlapping on the diagonal,
 * matching the design's "Get Paid By Link" icon. Built from bordered Views —
 * no SVG/icon library is installed.
 */
export function LinkIcon({ size = 24, color = "#0A1712" }: LinkIconProps) {
  const thickness = Math.max(2, size * 0.11);
  const linkWidth = size * 0.34;
  const linkHeight = size * 0.6;

  const capsule = {
    width: linkWidth,
    height: linkHeight,
    borderWidth: thickness,
    borderColor: color,
    borderRadius: linkWidth,
  } as const;

  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "-45deg" }],
      }}
    >
      <View
        style={{
          ...capsule,
          marginRight: -linkWidth * 0.42,
        }}
      />
      <View
        style={{
          ...capsule,
          marginLeft: -linkWidth * 0.42,
        }}
      />
    </View>
  );
}
