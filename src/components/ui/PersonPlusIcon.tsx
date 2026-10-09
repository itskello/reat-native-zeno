import Svg, { Circle, Path } from "react-native-svg";

type PersonPlusIconProps = {
  size?: number;
  color?: string;
};

/** A person with a small plus — the "add a saved recipient" glyph. */
export function PersonPlusIcon({
  size = 24,
  color = "#0A1712",
}: PersonPlusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={10} cy={7} r={3.6} stroke={color} strokeWidth={1.7} />
      <Path
        d="M3.4 20c0-3.5 2.95-6.1 6.6-6.1 1.35 0 2.6.35 3.65.98"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Circle cx={17.6} cy={17.6} r={4} stroke={color} strokeWidth={1.7} />
      <Path
        d="M17.6 15.7v3.8M15.7 17.6h3.8"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
