import { IslandLiquidShape } from "@/components/wallet/IslandLiquidShape";
import { ZenoCardSurface } from "@/components/wallet/ZenoCardSurface";
import { images } from "@/constants/images";
import {
  ISLAND_CANVAS_WIDTH,
  modelBox,
  pillBox,
} from "@/data/island-geometry";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletIslandTitle } from "@/store/wallet-nav";
import { Image } from "expo-image";
import { Text, View, useWindowDimensions } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

type DynamicIslandProps = {
  /** Scroll-driven collapse of the resting pill (0 = expanded, 1 = camera dot). */
  collapse?: SharedValue<number>;
  liftDistance?: number;
};

/**
 * Dynamic Island — two islands that siphon into one another.
 *
 * `islande` (the persistent pill) and `islande model` (the ZENO Card surface)
 * are two separate bodies. `IslandLiquidShape` draws them as one black liquid
 * silhouette; this component lays the readable content on top of exactly the
 * same geometry, so the pill title and the card UI always sit inside the shape.
 *
 * Geometry comes from the Lottie reference — see `data/island-geometry.ts`.
 * This component owns no gestures: `cardDragY` is driven by the wallet
 * surfaces, and everything here derives from it.
 */
export function DynamicIsland({
  collapse,
  liftDistance = 30,
}: DynamicIslandProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const title = useWalletIslandTitle();

  const scale = windowWidth / ISLAND_CANVAS_WIDTH;

  /** 0 = card closed (resting pill), 1 = card fully open. */
  const openness = useDerivedValue(() =>
    interpolate(cardDragY.value, [0, 300], [0, 1], "clamp")
  );

  /** The pill's own geometry — it widens as the card closes. */
  const pillStyle = useAnimatedStyle(() => {
    const b = pillBox(openness.value, scale);
    const lift = collapse
      ? interpolate(collapse.value, [0, 1], [0, -liftDistance], "clamp") *
        (1 - openness.value)
      : 0;

    return {
      left: b.x,
      top: b.y,
      width: b.w,
      height: b.h,
      borderRadius: b.r,
      transform: [{ translateY: lift }],
    };
  });

  /**
   * The pill's label. It fades out as the card opens — at full openness the
   * pill is only 165px wide and the card title belongs to the surface below.
   */
  const pillContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(openness.value, [0, 0.45], [1, 0], "clamp"),
  }));

  /**
   * The card surface, clipped to `islande model`. The user asked for the card
   * content to stay visible for the whole morph, so it is not faded — instead
   * it is clipped and scaled down with the shape, which is why `overflow` must
   * stay hidden: at rest the model is only 134x26px.
   */
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

  /**
   * The card content keeps its full open-state size and is scaled down inside
   * the clip, so text shrinks with the surface instead of being squashed by a
   * changing container width.
   *
   * `transformOrigin: top left` pins the content to the clip's corner, so the
   * scale needs no compensating translation. The card is authored for the open
   * width, so the scale factor follows the width — the model box gets much
   * shorter than it gets narrow, and the excess height is simply clipped.
   *
   * The final fade is deliberately short: the user asked for the content to
   * stay visible through the whole morph, but once the model has collapsed to
   * 134x26 it sits behind the pill, where a sliver of card UI would print over
   * the pill title.
   */
  const modelContentStyle = useAnimatedStyle(() => {
    const open = modelBox(1, scale);
    const current = modelBox(openness.value, scale);
    return {
      width: open.w,
      height: open.h,
      opacity: interpolate(openness.value, [0, 0.08], [0, 1], "clamp"),
      transform: [{ scale: current.w / open.w }],
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={{ width: windowWidth, height: windowHeight }}
    >
      {/* The fused black silhouette of both islands. */}
      <IslandLiquidShape
        openness={openness}
        width={windowWidth}
        height={windowHeight}
      />

      {/* `islande model` content — clipped to the shrinking card surface. */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: "absolute", overflow: "hidden" }, modelStyle]}
      >
        <Animated.View
          // The card content is fixed for the whole morph — only its scale
          // moves. Rasterising it once lets Android scale a GPU texture per
          // frame instead of re-composing the card's whole view tree inside a
          // clip whose corner radius is rebuilt on every frame. It is only ever
          // scaled down, so the texture never has to invent detail.
          renderToHardwareTextureAndroid
          style={[{ transformOrigin: "top left" }, modelContentStyle]}
        >
          <ZenoCardSurface contentTopGap={12} />
        </Animated.View>
      </Animated.View>

      {/* `islande` content — the persistent pill label. */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: "absolute" }, pillStyle]}
      >
        <Animated.View
          style={pillContentStyle}
          className="h-full flex-row items-center justify-between pl-7 pr-3"
        >
          <Text allowFontScaling={false} numberOfLines={1} className="text-[16px]">
            <IslandTitle title={title} />
          </Text>
          <Image
            source={images.mastercard}
            style={{ width: 36, height: 36 }}
            contentFit="contain"
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** First word muted, rest emphasised — the locked island typography. */
function IslandTitle({ title }: { title: string }) {
  const [first, ...rest] = title.split(" ");
  return (
    <>
      <Text className="font-semibold text-white/45">{first} </Text>
      <Text className="font-bold text-white">{rest.join(" ")}</Text>
    </>
  );
}
