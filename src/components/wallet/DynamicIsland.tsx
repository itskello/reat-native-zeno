import { BellIcon } from "@/components/ui/BellIcon";
import { GetPaidSurface } from "@/components/wallet/GetPaidSurface";
import { IslandLiquidShape } from "@/components/wallet/IslandLiquidShape";
import { SendMoneySurface } from "@/components/wallet/SendMoneySurface";
import { WithdrawSurface } from "@/components/wallet/WithdrawSurface";
import { ZenoCardSurface } from "@/components/wallet/ZenoCardSurface";
import { images } from "@/constants/images";
import {
    ISLAND_CANVAS_WIDTH,
    modelBox,
    pillBox,
} from "@/data/island-geometry";
import { isIslandRoom, type WalletScreen } from "@/data/wallet-screens";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletIslandTitle, useWalletNav, useWalletRoom } from "@/store/wallet-nav";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import Svg, { Path } from "react-native-svg";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedReaction,
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
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const room = useWalletRoom();
  const { user } = useUser();
  const firstName = user?.firstName ?? "there";
  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatarPlaceholder;
  const clearClosing = useWalletNav((s) => s.clearClosing);

  /**
   * Which room the model is showing. It falls back to CARD at Home so the
   * pull-down gesture has the card already mounted to reveal — the model is
   * never empty, it is only ever collapsed to 134x26 behind the pill.
   */
  const modelRoom: WalletScreen = room && isIslandRoom(room) ? room : "CARD";

  const scale = windowWidth / ISLAND_CANVAS_WIDTH;

  /** 0 = card closed (resting pill), 1 = card fully open. */
  const openness = useDerivedValue(() =>
    interpolate(cardDragY.value, [0, 300], [0, 1], "clamp")
  );

  /**
   * An island room stays mounted through its whole collapse — it is clipped by
   * the shrinking model, not unmounted — so `closing` can only be released once
   * the morph has actually finished. `WalletSurface` does this for the rooms it
   * hosts; for island rooms the morph is `cardDragY`, so it is watched here.
   */
  useAnimatedReaction(
    () => openness.value < 0.01,
    (settled, previous) => {
      if (settled && previous === false) runOnJS(clearClosing)();
    }
  );

  /** The pill's own geometry — stays in place on scroll, widens to fit profile. */
  const pillStyle = useAnimatedStyle(() => {
    const c = collapse ? collapse.value : 0;
    const b = pillBox(openness.value, scale);

    // Pill widens to near full-screen on scroll collapse (only when card is closed).
    const cardClosed = 1 - openness.value;
    const collapseWidth = interpolate(
      c,
      [0, 0.6],
      [b.w, (windowWidth - 24)],
      "clamp"
    ) * cardClosed + b.w * openness.value;

    const collapseLeft = interpolate(
      c,
      [0, 0.6],
      [b.x, 12],
      "clamp"
    ) * cardClosed + b.x * openness.value;

    return {
      left: collapseLeft,
      top: b.y,
      width: collapseWidth,
      height: b.h,
      borderRadius: b.r,
    };
  });

  /**
   * Default pill content (ZENO CARD + Mastercard).
   * Fades out as the card opens OR as scroll collapse progresses.
   */
  const pillContentStyle = useAnimatedStyle(() => {
    const c = collapse ? collapse.value : 0;
    const opacityByCard = interpolate(openness.value, [0, 0.45], [1, 0], "clamp");
    const opacityByScroll = interpolate(c, [0, 0.35], [1, 0], "clamp");
    return {
      opacity: Math.min(opacityByCard, opacityByScroll),
    };
  });

  /**
   * Profile content inside the pill — fades IN as the greeting scrolls up.
   * Stays pinned and centered once fully visible. Only when card is closed.
   */
  const profileContentStyle = useAnimatedStyle(() => {
    const c = collapse ? collapse.value : 0;
    const opacityByScroll = interpolate(c, [0.3, 0.7], [0, 1], "clamp");
    const opacityByCard = interpolate(openness.value, [0, 0.2], [1, 0], "clamp");
    return {
      opacity: opacityByScroll * opacityByCard,
    };
  });

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
        collapse={collapse}
        width={windowWidth}
        height={windowHeight}
      />

      {/* `islande model` content — clipped to the shrinking card surface. */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: "absolute", overflow: "hidden" }, modelStyle]}
      >
        <Animated.View
          // The room content is fixed for the whole morph — only its scale
          // moves. Rasterising it once lets Android scale a GPU texture per
          // frame instead of re-composing the whole view tree inside a clip
          // whose corner radius is rebuilt on every frame. It is only ever
          // scaled down, so the texture never has to invent detail.
          renderToHardwareTextureAndroid
          style={[{ transformOrigin: "top left" }, modelContentStyle]}
        >
          {modelRoom === "SEND" ? (
            <SendMoneySurface contentTopGap={12} />
          ) : modelRoom === "GETPAID" ? (
            <GetPaidSurface contentTopGap={12} />
          ) : modelRoom === "WITHDRAW" ? (
            <WithdrawSurface contentTopGap={12} />
          ) : (
            <ZenoCardSurface contentTopGap={12} onFrozenChange={setIsCardFrozen} />
          )}
        </Animated.View>
      </Animated.View>

      {/* `islande` content — the persistent pill label. */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: "absolute" }, pillStyle]}
      >
        {/* Default: ZENO CARD + Mastercard — fades out on scroll */}
        <Animated.View
          style={pillContentStyle}
          className="h-full flex-row items-center justify-between pl-7 pr-3"
        >
          <Text allowFontScaling={false} numberOfLines={1} className="text-[16px]">
            <IslandTitle title={title} muted={title === "Zeno Card" && isCardFrozen} />
          </Text>
          {title === "Zeno Card" && isCardFrozen ? (
            <FrozenCardIcon />
          ) : (
            <Image
              source={images.mastercard}
              style={{ width: 36, height: 36 }}
              contentFit="contain"
            />
          )}
        </Animated.View>

        {/* Collapsed: Profile info — centered inside the pill, fades in on scroll */}
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              bottom: 0,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
            },
            profileContentStyle,
          ]}
        >
          <Pressable
            onPress={() => router.push("/profile")}
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            hitSlop={8}
          >
            <Image
              source={avatarSource}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              contentFit="cover"
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ fontWeight: "700", fontSize: 16, color: "#ffffff" }}
              >
                Hey {firstName}
              </Text>
              <Text
                allowFontScaling={false}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 1 }}
              >
                Welcome Back
              </Text>
            </View>
          </Pressable>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BellIcon size={18} color="#ffffff" />
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** First word muted, rest emphasised — the locked island typography. */
function IslandTitle({ title, muted = false }: { title: string; muted?: boolean }) {
  const [first, ...rest] = title.split(" ");
  return (
    <>
      <Text className={`font-semibold ${muted ? "text-white/40" : "text-white/45"}`}>{first} </Text>
      <Text className={`font-bold ${muted ? "text-white/40" : "text-white"}`}>{rest.join(" ")}</Text>
    </>
  );
}

/** Compact frost mark shown in place of Mastercard while the card is frozen. */
function FrozenCardIcon() {
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-[#C4EC5C]/15">
      <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M8 5l4 2.3L16 5M8 19l4-2.3L16 19M4.2 7.5h4.6V3.9M19.8 16.5h-4.6v3.6"
          stroke="#C4EC5C"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
