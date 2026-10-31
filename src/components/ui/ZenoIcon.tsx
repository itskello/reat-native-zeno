import Svg, { Path, Rect } from "react-native-svg";

type ZenoIconProps = { size?: number };

/** Compact ZENO wallet mark for currency and balance indicators. */
export function ZenoIcon({ size = 30 }: ZenoIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1659 1659" fill="none" accessibilityLabel="ZENO">
      <Rect width={1659} height={1659} rx={335} fill="#C4EC5C" />
      <Path d="M716.268 763.41L838.838 765.176L1324.33 1010.33L1259.01 1079.95L1210.07 781.679L1321.56 782.74L1377.9 1126.07L1255.46 1125.13L769.702 878.339L834.885 807.899L887.321 1127.47L775.83 1126.41L716.268 763.41Z" fill="#192711" />
      <Path d="M329 1120L350.496 999.37L669.636 560.109L727.511 635.815H426.561L445.577 526H792L771.33 646.63L450.537 1085.89L391.836 1010.18H714.282L695.266 1120H329Z" fill="#192711" />
    </Svg>
  );
}
