import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { images } from "@/constants/images";
import { useWalletNav } from "@/store/wallet-nav";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

type ZenoCardSurfaceProps = {
  contentTopGap: number;
};

type CardTransaction = {
  id: string;
  merchant: string;
  date: string;
  amount: string;
  status: "Completed" | "Failed" | "Pending";
  isSuccess: boolean;
};

const CARD_TRANSACTIONS: CardTransaction[] = [
  {
    id: "card-tx-1",
    merchant: "ADOBE SYSTEMS",
    date: "Jul 18 2026 at 11:33am",
    amount: "4.6 USD",
    status: "Failed",
    isSuccess: false,
  },
  {
    id: "card-tx-2",
    merchant: "Adobe Subscription",
    date: "Jul 18 2026 at 11:32am",
    amount: "4.6 USD",
    status: "Failed",
    isSuccess: false,
  },
  {
    id: "card-tx-3",
    merchant: "Zeno Pro Access",
    date: "Jul 15 2026 at 09:14am",
    amount: "0.6 USD",
    status: "Completed",
    isSuccess: true,
  },
];

/**
 * ZENO Card Surface (CARD Room).
 *
 * Rendered when the user pulls down from Wallet Home or taps ZENO Card.
 * Attached directly to the Dynamic Island (AGENTS.md §6.2).
 * Surface color: Dark Navy / Dark Green (#0A1712).
 */
import { gesture, springs } from "@/constants/motion";
import { cardDragY } from "@/store/wallet-gesture";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, withSpring } from "react-native-reanimated";

export function ZenoCardSurface({ contentTopGap }: ZenoCardSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);

  const handleClose = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  const closeCardGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onUpdate((event) => {
      if (event.translationY < 0) {
        cardDragY.value = Math.max(0, 300 + event.translationY);
      }
    })
    .onFinalize((event, success) => {
      if (success) {
        const pulledUp = -event.translationY;
        if (
          pulledUp > gesture.distanceThreshold ||
          -event.velocityY > gesture.velocityThreshold
        ) {
          cardDragY.value = withSpring(0, springs.liquid);
          runOnJS(goHome)();
          return;
        }
      }
      cardDragY.value = withSpring(300, springs.liquid);
    });

  return (
    <GestureDetector gesture={closeCardGesture}>
      {/* No background: the Dynamic Island's liquid shape paints the dark
          surface behind this content, so an opaque rect here would cover the
          siphon neck with a hard edge. */}
      <View className="flex-1 px-5" style={{ paddingTop: contentTopGap }}>
        {/* Top Bar / Close Drag Indicator */}
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close Zeno Card"
          className="items-center py-2 active:opacity-70"
        >
          <View className="h-1.5 w-12 rounded-full bg-white/20" />
        </Pressable>

      {/* Card Header & Balance */}
      <View className="mt-4 items-center">
        <Text className="text-[14px] font-medium tracking-wide text-white/60">
          Card Balance
        </Text>
        <View className="mt-1 flex-row items-baseline justify-center">
          <Text className="text-[28px] font-bold text-white/50">$ </Text>
          <Text className="text-[36px] font-bold text-white tracking-tight">0.25</Text>
        </View>
      </View>

      {/* ZENO Virtual Card (Lime Green Card Widget) */}
      <View className="relative mt-6 overflow-hidden rounded-3xl bg-zeno-green p-6 shadow-xl">
        {/* Subtle Brand Watermark Background */}
        <View className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-black/5" />

        {/* Card Header Row: MasterCard Badge & Chip */}
        <View className="flex-row items-center justify-between">
          <Image
            source={images.mastercard}
            style={{ width: 38, height: 26 }}
            contentFit="contain"
          />
          <View className="h-7 w-9 rounded-md border border-black/10 bg-amber-200/90 items-center justify-center">
            <View className="h-4 w-6 rounded-sm border border-black/20 bg-amber-300/80" />
          </View>
        </View>

        {/* Card Logo & Brand Name */}
        <View className="mt-6">
          <Text className="font-heading text-[22px] font-bold tracking-wider text-zeno-textPrimary">
            ZENO
          </Text>
        </View>

        {/* Masked Card Number & Expiry */}
        <View className="mt-8 flex-row items-center justify-between">
          <Text className="font-mono text-[16px] font-semibold tracking-widest text-zeno-textPrimary">
            5200 828 ****** 5678
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center space-x-3">
            <Text className="text-[11px] font-medium text-zeno-textSecondary">EXP</Text>
            <Text className="text-[13px] font-semibold text-zeno-textPrimary">12/2031</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions Row */}
      <View className="mt-6 flex-row justify-around rounded-2xl bg-white/5 py-4 px-2">
        <Pressable className="items-center space-y-1.5 active:opacity-70">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-zeno-green shadow-md">
            <Text className="text-[22px] font-bold text-zeno-textPrimary">+</Text>
          </View>
          <Text className="text-[12px] font-medium text-white/80">Top Up</Text>
        </Pressable>

        <Pressable className="items-center space-y-1.5 active:opacity-70">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10 shadow-md border border-white/10">
            <EyeIcon size={20} color="#FFFFFF" />
          </View>
          <Text className="text-[12px] font-medium text-white/80">View Details</Text>
        </Pressable>

        <Pressable className="items-center space-y-1.5 active:opacity-70">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/10 shadow-md border border-white/10">
            <Text className="text-[18px] font-bold text-white">•••</Text>
          </View>
          <Text className="text-[12px] font-medium text-white/80">More</Text>
        </Pressable>
      </View>

      {/* Card Specific Transactions Section */}
      <View className="mt-6 flex-1">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[16px] font-bold text-white">Card Activity</Text>
          <Text className="text-[13px] font-medium text-zeno-green">See All</Text>
        </View>

        <View className="space-y-3">
          {CARD_TRANSACTIONS.map((tx) => (
            <View
              key={tx.id}
              className="flex-row items-center justify-between rounded-2xl bg-white/10 p-3.5"
            >
              <View className="flex-row items-center space-x-3">
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full ${
                    tx.isSuccess ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
                >
                  <ArrowIcon
                    size={16}
                    color={tx.isSuccess ? "#22C55E" : "#EF4444"}
                    direction={tx.isSuccess ? "up-right" : "down-right"}
                  />
                </View>
                <View>
                  <Text className="text-[14px] font-semibold text-white">{tx.merchant}</Text>
                  <Text className="text-[11px] text-white/50">{tx.date}</Text>
                </View>
              </View>

              <View className="items-end">
                <Text className="text-[14px] font-bold text-white">{tx.amount}</Text>
                <Text
                  className={`text-[11px] font-medium ${
                    tx.isSuccess ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tx.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  </GestureDetector>
  );
}
