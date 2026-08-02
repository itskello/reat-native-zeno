import { View } from "react-native";

type LockIconProps = {
  size?: number;
  color?: string;
};

export function LockIcon({ size = 22, color = "#101010" }: LockIconProps) {
  const shackleWidth = size * 0.52;
  const shackleHeight = size * 0.44;
  const bodyHeight = size * 0.58;

  return (
    <View style={{ width: size, alignItems: "center" }}>
      <View
        style={{
          width: shackleWidth,
          height: shackleHeight,
          borderWidth: 2,
          borderBottomWidth: 0,
          borderColor: color,
          borderTopLeftRadius: shackleWidth / 2,
          borderTopRightRadius: shackleWidth / 2,
          marginBottom: -2,
        }}
      />
      <View
        style={{
          width: size,
          height: bodyHeight,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: size * 0.07,
            backgroundColor: color,
          }}
        />
        <View
          style={{
            width: size * 0.09,
            height: size * 0.12,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
