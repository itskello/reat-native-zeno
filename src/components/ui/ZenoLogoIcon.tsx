import Svg, { Path, Rect } from "react-native-svg";

/**
 * ZENO Logo Icon — the official brand mark rendered as an SVG component.
 *
 * The logo is a rounded square with the ZENO lime-green background (#C4EC5C)
 * and the two dark-green letterform paths. Use `size` to scale it uniformly.
 */
export function ZenoLogoIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 419 419"
      fill="none"
    >
      {/* Lime-green rounded square background */}
      <Rect width="419" height="419" rx="113" fill="#C4EC5C" />

      {/* Right letterform path */}
      <Path
        d="M180.902 192.808L211.858 193.254L334.475 255.17L317.978 272.753L305.618 197.422L333.776 197.69L348.004 284.403L317.082 284.164L194.397 221.835L210.86 204.044L224.103 284.756L195.945 284.488L180.902 192.808Z"
        fill="#192711"
      />

      {/* Left letterform path */}
      <Path
        d="M83.0039 282.907L88.436 252.445L169.082 141.52L183.707 160.638H107.657L112.463 132.907H200.004L194.781 163.369L113.716 274.293L98.8825 255.176H180.365L175.559 282.907H83.0039Z"
        fill="#192711"
      />
    </Svg>
  );
}
