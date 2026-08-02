import { View } from "react-native";

type EyeIconProps = {
  size?: number;
  color?: string;
  crossed?: boolean;
};

export function EyeIcon({
  size = 24,
  color = "#9A9A9A",
  crossed = false,
}: EyeIconProps) {
  const pupil = size * 0.34;

  return (
    <View
      style={{
        width: size,
        height: size * 0.66,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size,
          height: size * 0.66,
          borderWidth: 1.8,
          borderColor: color,
          borderRadius: size * 0.33,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scaleX: 1.15 }],
        }}
      >
        <View
          style={{
            width: pupil,
            height: pupil,
            borderRadius: pupil / 2,
            borderWidth: 1.8,
            borderColor: color,
          }}
        />
      </View>

      {crossed ? (
        <View
          style={{
            position: "absolute",
            width: size * 1.2,
            height: 1.8,
            backgroundColor: color,
            transform: [{ rotate: "-40deg" }],
          }}
        />
      ) : null}
    </View>
  );
}
