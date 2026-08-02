import { View } from "react-native";

type CheckIconProps = {
  size?: number;
  color?: string;
  thickness?: number;
};

/**
 * A checkmark drawn as two crossed strokes (short + long) forming a tick.
 * Used for the satisfied password rules on the Reset Password screen.
 */
export function CheckIcon({
  size = 14,
  color = "#0A1712",
  thickness = 2,
}: CheckIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size * 0.34,
          height: size * 0.62,
          borderRightWidth: thickness,
          borderBottomWidth: thickness,
          borderColor: color,
          transform: [{ rotate: "45deg" }],
          marginTop: -size * 0.12,
        }}
      />
    </View>
  );
}
