import { CloseIcon } from "@/components/ui/CloseIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { colors } from "@/theme/colors";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type GetPaidSurfaceProps = {
  contentTopGap: number;
};

/**
 * Get Paid surface (GETPAID room).
 *
 * Rendered inside the Dynamic Island's `islande model`, exactly like ZENO Card
 * and Send Money, so the room shares the one island-scale morph instead of
 * getting its own transition. Consequences for this file:
 *
 * - the layout is authored at full-screen size and anchored top-left, because
 *   the island scales it up from its own top-left corner;
 * - it paints no background — the island's liquid shape is the dark hero, and
 *   an opaque rect here would cover the siphon neck with a hard edge.
 * - Only the top ~80px (the header area) must stay legible throughout the
 *   morph — everything below is revealed/clipped naturally by the scale + clip.
 */
export function GetPaidSurface({ contentTopGap }: GetPaidSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);

  const close = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  // The room closes only through the dismiss button now, leaving the content
  // area free to scroll without fighting a swipe-to-close gesture.

  // TODO: route each option to its own sub-flow once those screens are built
  // (AGENTS.md Get Paid flow: Payment Link, Request Money, QR Code).
  const openPaymentLink = () => {};
  const openRequestMoney = () => {};
  const openQRCode = () => {};

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: contentTopGap, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {/* Dismiss cross, right aligned — mirrors Send Money layout exactly. */}
        <View className="h-[34px] flex-row justify-end px-11">
          <Pressable
            onPress={close}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close Get Paid"
            className="active:opacity-60"
          >
            <CloseIcon size={26} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </View>

        {/* Title — "Get" dimmed, "Paid" emphasised (locked island typography). */}
        <View className="mt-4 flex-row items-baseline px-11">
          <Text
            allowFontScaling={false}
            className="font-semibold text-[32px] text-white/40"
          >
            Get{" "}
          </Text>
          <Text
            allowFontScaling={false}
            className="font-bold text-[32px] text-white"
          >
            Paid
          </Text>
        </View>

        {/* The design shows a large gap here — the prompt confirms this is a
            design-export artifact, not intentional blank space. We use flex-1
            to push "Choose Method" to the lower third, matching the visual
            weight seen on ZENO Card and Send Money. */}
        <View className="flex-1" />

        {/* Choose Method section — pushed to lower third of the surface. */}
        <View className="px-11 pb-16">
          <Text
            allowFontScaling={false}
            className="mb-9 text-[20px] text-white/75"
          >
            Choose Method
          </Text>

          <GetPaidOption
            title="Create Payment Link"
            circleColor={colors.zenoGreen}
            onPress={openPaymentLink}
          >
            <Image
              source={images.linkIcon}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              tintColor={colors.zenoDark}
            />
          </GetPaidOption>

          <GetPaidOption
            title="Request Money"
            circleColor={colors.zenoGreen}
            onPress={openRequestMoney}
          >
            <Image
              source={images.requestMoney}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              tintColor={colors.zenoDark}
            />
          </GetPaidOption>

          <GetPaidOption
            title="QR Code"
            circleColor={colors.zenoMint}
            onPress={openQRCode}
            isLast
          >
            <Image
              source={images.withdraw}
              style={{ width: 26, height: 26 }}
              contentFit="contain"
              tintColor={colors.zenoDark}
            />
          </GetPaidOption>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * One "how do you want to get paid" row: coloured icon circle + label.
 * No subtitle, no chevron — the design keeps this surface clean and minimal.
 */
function GetPaidOption({
  title,
  circleColor,
  onPress,
  isLast = false,
  children,
}: {
  title: string;
  circleColor: string;
  onPress: () => void;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={`flex-row items-center active:opacity-70 ${isLast ? "" : "mb-8"}`}
    >
      <View
        className="h-[58px] w-[58px] items-center justify-center rounded-full border border-black/20"
        style={{ backgroundColor: circleColor }}
      >
        {children}
      </View>

      <Text
        allowFontScaling={false}
        className="ml-5 flex-1 font-semibold text-[21px] text-white"
      >
        {title}
      </Text>
    </Pressable>
  );
}
