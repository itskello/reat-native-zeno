import { View } from "react-native";

type MailIconProps = {
  size?: number;
  color?: string;
};

/**
 * Envelope outline, drawn with plain Views (the project has no SVG library).
 * Used inside the blue confirmation badge on the Forgot Password screen.
 */
export function MailIcon({ size = 24, color = "#FFFFFF" }: MailIconProps) {
  const height = size * 0.72;

  return (
    <View
      style={{
        width: size,
        height,
        borderWidth: 2,
        borderColor: color,
        borderRadius: size * 0.16,
        overflow: "hidden",
        alignItems: "center",
      }}
    >
      {/* The flap: two edges meeting at the top centre, rotated into a "V". */}
      <View
        style={{
          width: size * 0.62,
          height: size * 0.62,
          borderTopWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          transform: [{ rotate: "135deg" }],
          marginTop: -size * 0.3,
        }}
      />
    </View>
  );
}
