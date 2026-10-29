import { Svg, Path } from "react-native-svg";

type EyeIconProps = {
  size?: number;
  color?: string;
  /** When true, renders the eye-off (hidden) variant */
  crossed?: boolean;
};

/**
 * Premium SVG eye icon with two states:
 * - crossed=false → eye open (show password)
 * - crossed=true  → eye off / slashed (hide password)
 *
 * Uses the exact SVG paths provided in the ZENO design reference.
 */
export function EyeIcon({
  size = 24,
  color = "#9A9A9A",
  crossed = false,
}: EyeIconProps) {
  if (crossed) {
    // Eye-off: eye with a diagonal slash through it
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Diagonal slash line */}
        <Path
          d="M2 2L22 22"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Eye outline with parts cut away */}
        <Path
          d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Partial pupil arc */}
        <Path
          d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // Eye open: standard eye with pupil circle
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Eye outline */}
      <Path
        d="M2 12C2 12 5.63636 5 12 5C18.3636 5 22 12 22 12C22 12 18.3636 19 12 19C5.63636 19 2 12 2 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pupil */}
      <Path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
