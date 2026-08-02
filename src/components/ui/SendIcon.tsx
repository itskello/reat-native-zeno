import { View } from "react-native";

type SendIconProps = {
  size?: number;
  color?: string;
};

/**
 * Paper-plane "send" glyph, approximated as a filled triangle pointing
 * up-right (matching the design's Send Money icon). Built with the
 * border-triangle trick — no SVG/icon library is installed.
 */
export function SendIcon({ size = 22, color = "#FFFFFF" }: SendIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "45deg" }],
      }}
    >
      {/* Triangle: a zero-size box with a bottom border colored in. */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: size * 0.4,
          borderRightWidth: size * 0.4,
          borderBottomWidth: size * 0.78,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderBottomColor: color,
        }}
      />
    </View>
  );
}
