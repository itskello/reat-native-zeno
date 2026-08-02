import { colors } from "@/theme/colors";
import {
  Blur,
  Canvas,
  ColorMatrix,
  Group,
  RoundedRect,
  rect,
  rrect,
} from "@shopify/react-native-skia";
import type { SharedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";
import {
  ISLAND_CANVAS_WIDTH,
  modelBox,
  pillBox,
} from "@/data/island-geometry";

type IslandLiquidShapeProps = {
  /** 1 = ZENO Card open, 0 = closed. Driven by the wallet drag gesture. */
  openness: SharedValue<number>;
  width: number;
  height: number;
};

/**
 * Blur radius (px) applied to both islands before thresholding.
 *
 * This single number controls how far apart the two shapes can be and still
 * fuse. Too low and the neck never forms; too high and the corners go soft.
 */
const FUSE_BLUR = 14;

/**
 * Alpha threshold matrix — the second half of the metaball trick.
 *
 * The last row multiplies alpha hard (x60) then subtracts a large constant, so
 * the soft blurred gradient is cut back to a crisp edge. Where two blurred
 * halos overlap their alpha sums above the cut, which is exactly where the neck
 * appears. Nothing draws the neck: it is a consequence of the overlap the
 * Lottie geometry produces (see `data/island-geometry.ts`).
 */
const THRESHOLD_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 60, -28,
];

/**
 * The black shape behind the Dynamic Island — both islands as one liquid body.
 *
 * `islande` (the pill) and `islande model` (the card surface) are drawn as two
 * separate rounded rects inside a blurred + thresholded group. As `openness`
 * moves they overlap, siphon into each other, and separate again.
 *
 * Only the silhouette lives here. Card content is a React Native layer above,
 * aligned on the same geometry.
 */
export function IslandLiquidShape({
  openness,
  width,
  height,
}: IslandLiquidShapeProps) {
  const scale = width / ISLAND_CANVAS_WIDTH;

  // A single `rect` value per island keeps this to two derived values, so the
  // whole silhouette updates in one UI-thread pass per frame.
  const pillRect = useDerivedValue(() => {
    const b = pillBox(openness.value, scale);
    return rrect(rect(b.x, b.y, b.w, b.h), b.r, b.r);
  });

  const modelRect = useDerivedValue(() => {
    const b = modelBox(openness.value, scale);
    return rrect(rect(b.x, b.y, b.w, b.h), b.r, b.r);
  });

  return (
    <Canvas style={{ width, height }} pointerEvents="none">
      <Group
        layer={
          <Group>
            <Blur blur={FUSE_BLUR} />
            <ColorMatrix matrix={THRESHOLD_MATRIX} />
          </Group>
        }
      >
        <RoundedRect rect={modelRect} color={colors.zenoDark} />
        <RoundedRect rect={pillRect} color={colors.zenoDark} />
      </Group>
    </Canvas>
  );
}
