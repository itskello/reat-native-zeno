import {
  ISLAND_CANVAS_WIDTH,
  modelBox,
  pillBox,
} from "@/data/island-geometry";
import { colors } from "@/theme/colors";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  FeColorMatrix,
  FeGaussianBlur,
  Filter,
  G,
  Rect,
} from "react-native-svg";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

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
].join(" ");

/**
 * How far down the junction zone reaches, in Lottie canvas units.
 *
 * The pill's bottom sits at y=75 and the card's top never goes past y=78, so
 * everything that can fuse happens above ~80. Past that the card is an ordinary
 * rounded rect with nothing to fuse with.
 */
const NECK_BAND = 90;

/**
 * The black shape behind the Dynamic Island — both islands as one liquid body.
 *
 * `islande` (the pill) and `islande model` (the card surface) meet, siphon into
 * each other, and separate again as `openness` moves.
 *
 * The two bodies are plain `Animated.View`s: a solid colour and a border radius
 * are composited on the GPU, and Reanimated drives them without a React render.
 * Only the strip where they touch goes through SVG, because only there does the
 * blur + alpha-threshold pair have anything to do.
 *
 * That split is a performance requirement, not a style choice. Android
 * rasterises SVG filters on the CPU, so the filtered surface is redrawn in
 * software on every frame of the drag — at full screen height that is roughly
 * 335,000 pixels blurred 60 times a second, which is what made the swipe drag
 * on device while staying smooth in the simulator. Bounded to the junction it
 * is under a quarter of that, and none of it is card body.
 *
 * The band clips the card's blurred copy mid-shape, but the crisp body
 * underneath is the same flat colour, so the cut is invisible.
 *
 * react-native-svg rather than Skia so the whole wallet runs in Expo Go: a
 * native module Expo Go doesn't ship forces a full rebuild for every change.
 * The two filter primitives are the same operations the Skia version used.
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

  // The blur has to scale with the canvas: the gap it bridges is authored in
  // Lottie units, so a fixed pixel radius would fuse differently per device.
  const blur = FUSE_BLUR * scale;
  const bandHeight = NECK_BAND * scale;

  const pillStyle = useAnimatedStyle(() => {
    const b = pillBox(openness.value, scale);
    return {
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      borderRadius: b.r,
    };
  });

  const modelStyle = useAnimatedStyle(() => {
    const b = modelBox(openness.value, scale);
    return {
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      borderRadius: b.r,
    };
  });

  // Inside the band the same two boxes are redrawn as SVG rects. Animating
  // x/y/width/height/rx keeps the morph on the UI thread here too.
  const pillProps = useAnimatedProps(() => {
    const b = pillBox(openness.value, scale);
    return { x: b.x, y: b.y, width: b.w, height: b.h, rx: b.r, ry: b.r };
  });

  const modelProps = useAnimatedProps(() => {
    const b = modelBox(openness.value, scale);
    return { x: b.x, y: b.y, width: b.w, height: b.h, rx: b.r, ry: b.r };
  });

  return (
    <View pointerEvents="none" style={{ width, height }}>
      {/* The bodies, crisp and unfiltered, on the GPU. */}
      <Animated.View style={[styles.body, modelStyle]} />
      <Animated.View style={[styles.body, pillStyle]} />

      {/* The junction, and only the junction. */}
      <Svg
        style={styles.band}
        width={width}
        height={bandHeight}
        pointerEvents="none"
      >
        <Defs>
          {/*
            userSpaceOnUse pins the filter to the band. The default
            (objectBoundingBox percentages) would follow the card as it grows,
            undoing the bound the small canvas buys.

            The region matches the canvas exactly — no bleed margin. A filter
            region wider than its canvas is pixels blurred and thresholded only
            to be clipped away on the next step. The blur does fade at the
            band's lower edge for want of source below it, but the crisp card
            body underneath is the same flat colour and covers the falloff.
          */}
          <Filter
            id="islandFuse"
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={bandHeight}
          >
            <FeGaussianBlur
              in="SourceGraphic"
              stdDeviation={blur}
              result="blurred"
            />
            <FeColorMatrix in="blurred" type="matrix" values={THRESHOLD_MATRIX} />
          </Filter>
        </Defs>

        {/*
          Both islands share ONE filtered group — filtering them separately
          would blur and threshold each halo on its own, and two independently
          crisp shapes never fuse. The neck exists because the halos are summed
          before the threshold is applied.
        */}
        <G filter="url(#islandFuse)">
          <AnimatedRect animatedProps={modelProps} fill={colors.zenoDark} />
          <AnimatedRect animatedProps={pillProps} fill={colors.zenoDark} />
        </G>
      </Svg>
    </View>
  );
}

// Runtime-driven position and size — Reanimated writes these every frame.
const styles = StyleSheet.create({
  body: {
    position: "absolute",
    backgroundColor: colors.zenoDark,
  },
  band: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
