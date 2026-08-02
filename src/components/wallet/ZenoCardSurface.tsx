import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { images } from "@/constants/images";
import { gesture, springs } from "@/constants/motion";
import { formatAmount, getCurrency } from "@/data/currencies";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { colors } from "@/theme/colors";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, withSpring } from "react-native-reanimated";

type ZenoCardSurfaceProps = {
  contentTopGap: number;
};

type CardTransaction = {
  id: string;
  merchant: string;
  date: string;
  amount: string;
  status: "Completed" | "Failed" | "Pending";
  /** Row accent — the design varies the avatar colour per merchant. */
  accent: string;
  accentIcon: string;
};

/**
 * PLACEHOLDER card activity so the surface can be built and reviewed. The
 * backend is the source of truth for transactions (AGENTS.md — Financial Data
 * Rules); this list is replaced by a fetch in the transaction store later.
 */
const CARD_TRANSACTIONS: CardTransaction[] = [
  {
    id: "card-tx-1",
    merchant: "ADOBE ADOBE",
    date: "Jul 18 2026 at 11:33am",
    amount: "4.6 USD",
    status: "Failed",
    accent: colors.zenoGreen,
    accentIcon: colors.zenoDark,
  },
  {
    id: "card-tx-2",
    merchant: "Adobe",
    date: "Jul 18 2026 at 11:32am",
    amount: "4.6 USD",
    status: "Failed",
    accent: colors.zenoGreen,
    accentIcon: colors.zenoDark,
  },
  {
    id: "card-tx-3",
    merchant: "Zeno",
    date: "Jul 15 2026 at 09:14am",
    amount: "0.6 USD",
    status: "Completed",
    accent: "#D6E9FF",
    accentIcon: colors.zenoBlue,
  },
];

/** Aspect ratios of the two brand assets, so neither is ever distorted. */
const CARD_ASPECT = 3470 / 2438;
const LOGO_ASPECT = 3380 / 1424;

/**
 * ZENO Card Surface (CARD room).
 *
 * Layered per the design: the dark hero is painted by the island's liquid
 * shape, the virtual card sits on it, and a white transactions sheet floats
 * above and bleeds off the bottom edge.
 *
 * The card is a single ready-made asset (`images.zenoCard` — both stacked
 * cards, already rotated, on transparency), so nothing here draws a card.
 */
export function ZenoCardSurface({ contentTopGap }: ZenoCardSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);
  const wallet = useWalletStore((s) => s.wallet);

  // The ZENO Card draws from the single Wallet balance — there is no separate
  // card balance to top up (AGENTS.md — Wallet Financial Model).
  const currency = wallet ? getCurrency(wallet.currency) : null;
  const balanceLabel = wallet ? formatAmount(wallet.balance, wallet.currency) : "—";
  const balanceNumber = currency
    ? balanceLabel.replace(currency.symbol, "").trim()
    : balanceLabel;

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
      <View className="flex-1" style={{ paddingTop: contentTopGap }}>
        {/* Header — "ZENO Card" centred, dismiss cross on the right. */}
        <View className="h-[34px] flex-row items-center justify-center px-6">
          <Image
            source={images.logoGreenLight}
            style={{ height: 24, width: 24 * LOGO_ASPECT }}
            contentFit="contain"
            tintColor={colors.zenoGreen}
          />
          <Text
            allowFontScaling={false}
            className="ml-1.5 font-bold text-[24px] text-white"
          >
            Card
          </Text>

          <Pressable
            onPress={handleClose}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close Zeno Card"
            className="absolute right-6 active:opacity-60"
          >
            <CloseIcon size={20} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </View>

        {/* Card balance — the Wallet balance, seen from the card. */}
        <View className="mt-7 items-center">
          <Text
            allowFontScaling={false}
            className="font-medium text-[14px] text-white/70"
          >
            Card Balance
          </Text>
          <View className="mt-1.5 flex-row items-baseline">
            <Text
              allowFontScaling={false}
              className="font-bold text-[44px] leading-[50px] text-white"
            >
              {balanceNumber}
            </Text>
            {currency ? (
              <Text
                allowFontScaling={false}
                className="ml-1.5 font-bold text-[20px] text-white/70"
              >
                {currency.symbol}
              </Text>
            ) : null}
          </View>
        </View>

        {/* The two stacked virtual cards — one ready-made asset. */}
        <View className="mt-5 px-7">
          <Image
            source={images.zenoCard}
            style={{ width: "100%", aspectRatio: CARD_ASPECT }}
            contentFit="contain"
          />
        </View>

        <Text
          allowFontScaling={false}
          className="mt-3 text-center font-medium text-[16px] text-white/85"
        >
          12/2031{"     "}••••• 5678
        </Text>

        {/* Card actions. */}
        <View className="mt-6 flex-row justify-center gap-x-10">
          <CardAction label="Top Up" filled onPress={() => {}}>
            <PlusGlyph color={colors.zenoDark} />
          </CardAction>
          <CardAction label="View Card" onPress={() => {}}>
            <EyeIcon size={22} color={colors.zenoGreen} />
          </CardAction>
          <CardAction label="More" onPress={() => {}}>
            <DotsGlyph color={colors.zenoGreen} />
          </CardAction>
        </View>

        {/* Floating white sheet — bleeds off the bottom of the surface. */}
        <View className="mt-7 flex-1 overflow-hidden rounded-t-[26px] bg-white px-5 pt-5">
          <View className="flex-row items-center justify-between">
            <Text
              allowFontScaling={false}
              className="font-bold text-[24px] text-zeno-text-primary"
            >
              Transactions
            </Text>
            <Pressable hitSlop={10} className="active:opacity-60">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[16px] text-zeno-green-deep"
              >
                See all
              </Text>
            </Pressable>
          </View>

          <View className="mt-1">
            {CARD_TRANSACTIONS.map((tx, index) => (
              <View
                key={tx.id}
                className={`flex-row items-center py-4 ${
                  index > 0 ? "border-t border-black/[0.06]" : ""
                }`}
              >
                <View
                  className="h-[34px] w-[34px] items-center justify-center rounded-full"
                  style={{ backgroundColor: tx.accent }}
                >
                  <ArrowIcon size={15} color={tx.accentIcon} direction="up-right" />
                </View>

                <View className="ml-3 flex-1">
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    className="font-bold text-[16px] text-zeno-text-primary"
                  >
                    {tx.merchant}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="mt-0.5 text-[12px] text-zeno-text-secondary"
                  >
                    {tx.date}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    allowFontScaling={false}
                    className="font-semibold text-[15px] text-zeno-text-primary"
                  >
                    {tx.amount}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className={`mt-0.5 text-[12px] font-medium ${
                      tx.status === "Failed"
                        ? "text-zeno-error"
                        : "text-zeno-text-secondary"
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

/** One circular card action with its label — three of them, identical shape. */
function CardAction({
  label,
  filled = false,
  onPress,
  children,
}: {
  label: string;
  filled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="items-center active:opacity-70"
    >
      <View
        className={`h-[51px] w-[51px] items-center justify-center rounded-full ${
          filled ? "bg-zeno-green" : "bg-white/10"
        }`}
      >
        {children}
      </View>
      <Text
        allowFontScaling={false}
        className="mt-2 font-medium text-[13px] text-white/85"
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A plus inside a rounded square — the "add" glyph from the design. */
function PlusGlyph({ color }: { color: string }) {
  return (
    <View
      className="h-[21px] w-[21px] items-center justify-center rounded-[6px] border-[1.8px]"
      style={{ borderColor: color }}
    >
      <View style={{ position: "absolute", width: 11, height: 1.8, backgroundColor: color }} />
      <View style={{ position: "absolute", width: 1.8, height: 11, backgroundColor: color }} />
    </View>
  );
}

/** Three dots — the "more" glyph. */
function DotsGlyph({ color }: { color: string }) {
  return (
    <View className="flex-row items-center gap-x-1">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 4.5, height: 4.5, borderRadius: 3, backgroundColor: color }}
        />
      ))}
    </View>
  );
}
