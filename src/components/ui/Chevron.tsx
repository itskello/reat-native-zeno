import { View } from "react-native";

type ChevronProps = {
  direction: "down" | "right";
  size?: number;
  color?: string;
  thickness?: number;
};

export function Chevron({
  direction,
  size = 12,
  color = "#101010",
  thickness = 2,
}: ChevronProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRightWidth: thickness,
        borderBottomWidth: thickness,
        borderColor: color,
        transform: [{ rotate: direction === "down" ? "45deg" : "-45deg" }],
      }}
    />
  );
}
