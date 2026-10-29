import { CloseIcon } from "@/components/ui/CloseIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { formatAmount, getCurrency } from "@/data/currencies";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { colors } from "@/theme/colors";
import { ZenoCardLogo } from "@/components/wallet/ZenoCardLogo";
import { ZenoCardFrozenArtwork } from "@/components/wallet/ZenoCardFrozenArtwork";
import { Image } from "expo-image";
import { ZenoCardSkeleton } from "@/components/ui/Skeleton";
import { VirtualCardFlowModal, type CardFlowPanel } from "@/components/wallet/VirtualCardFlowModal";
import { TransactionItem } from "@/components/wallet/TransactionItem";
import { useTransactionStore } from "@/store/transaction-store";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { isCardSandboxEnabled, virtualCardService, type CardBalanceResult, type VirtualCardOverview } from "@/features/virtual-card/card-service";
import { Pressable, ScrollView, Text, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type ZenoCardSurfaceProps = {
  contentTopGap: number;
  onFrozenChange?: (frozen: boolean) => void;
};

/** Both supplied state artworks use the same display frame and proportions. */
const CARD_ARTWORK_ASPECT = 1799 / 1196;

/**
 * ZENO Card Surface (CARD room).
 *
 * Layered per the design: the dark hero is painted by the island's liquid
 * shape, the virtual card sits on it, and a white transactions sheet floats
 * above and bleeds off the bottom edge.
 *
 * The active and frozen card artwork switch inside one fixed-size frame.
 */
export function ZenoCardSurface({ contentTopGap, onFrozenChange }: ZenoCardSurfaceProps) {
  const goHome = useWalletNav((s) => s.goHome);
  const navigateTo = useWalletNav((s) => s.navigateTo);
  const { getToken } = useAuth();
  const transactions = useTransactionStore((state) => state.transactions);
  const cardTransactions = useMemo(
    () => transactions.filter((item) => item.category === "card" || item.typeId === "card_payment"),
    [transactions]
  );
  const [cardFlow, setCardFlow] = useState<CardFlowPanel | null>(null);
  // Tracks frozen state locally; updated by VirtualCardFlowModal after a
  // successful freeze/unfreeze API call (AGENTS.md — no financial logic in UI).
  const [isFrozen, setIsFrozen] = useState(false);
  const [card, setCard] = useState<VirtualCardOverview | null>(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = isCardSandboxEnabled ? "" : await getToken();
      if (!token && !isCardSandboxEnabled) {
        if (!cancelled) { setCardError("Reconnectez-vous pour consulter votre carte."); setCardLoading(false); }
        return;
      }
      const result = await virtualCardService.getOverview(token ?? "");
      if (cancelled) return;
      if (result.ok) {
        const validOverview =
          Number.isFinite(Number(result.data.balance)) &&
          Number(result.data.balance) >= 0 &&
          /^\d{4}$/.test(result.data.last4) &&
          (result.data.status === "active" || result.data.status === "frozen");
        if (validOverview) {
          setCard(result.data);
          setIsFrozen(result.data.status === "frozen");
        } else {
          setCardError("Les informations de carte reçues sont invalides.");
        }
      } else setCardError(result.error);
      setCardLoading(false);
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  useEffect(() => {
    onFrozenChange?.(isFrozen);
  }, [isFrozen, onFrozenChange]);

  const currency = getCurrency(card?.currency ?? "USD");
  const balanceLabel = formatAmount(Number(card?.balance ?? "0.00"), currency.code);
  const balanceNumber = card ? Number(card.balance).toFixed(2) : "0.00";

  const handleClose = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  const handleTopUp = () => {
    setCardFlow("topup");
  };

  const handleSeeAll = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    navigateTo("TRANSACTIONS");
  };

  if (cardLoading) {
    return <ZenoCardSkeleton />;
  }

  return (
    <View className="flex-1">
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: contentTopGap }}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* No background: the Dynamic Island's liquid shape paints the dark
          surface behind this content, so an opaque rect here would cover the
          siphon neck with a hard edge. */}
      <View className="flex-1">
        {/* Header — "ZENO Card" centred, dismiss cross on the right. */}
        <View className="h-[34px] flex-row items-center justify-center px-6">
          <View style={{ transform: [{ translateY: 12 }] }}>
            <ZenoCardLogo height={24} variant={isFrozen ? "muted" : "brand"} />
          </View>

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

        {/* Card balance is separate from the wallet balance. */}
        <View className="mt-8 items-center">
          <Text
            allowFontScaling={false}
            className={`font-medium text-[14px] ${isFrozen ? "text-white/40" : "text-white/70"}`}
          >
            Card Balance
          </Text>
          <View className="mt-1 flex-row items-start">
            {currency ? (
              <Text
                allowFontScaling={false}
                className={`mr-1 mt-1 font-bold text-[20px] ${isFrozen ? "text-white/40" : "text-white/70"}`}
              >
                {currency.symbol}
              </Text>
            ) : null}
            <Text
              allowFontScaling={false}
              className={`font-bold text-[44px] leading-[50px] ${isFrozen ? "text-white/45" : "text-white"}`}
            >
              {balanceNumber}
            </Text>
          </View>
        </View>
        {cardError ? <Text className="mt-2 text-center text-[12px] text-white/70">{cardError}</Text> : null}

        {/* Swap artwork in the same fixed frame so freeze/unfreeze never resizes the card. */}
        <View className="mt-3 px-7">
          <View className="w-full" style={{ aspectRatio: CARD_ARTWORK_ASPECT }}>
            {isFrozen ? (
              <ZenoCardFrozenArtwork />
            ) : (
              <Image
                source={images.zenoCardActive}
                style={{ width: "100%", height: "100%" }}
                contentFit="contain"
                accessibilityLabel="ZENO Card"
              />
            )}
          </View>
        </View>

        <Text
          allowFontScaling={false}
          className={`mt-3 text-center font-medium text-[16px] ${isFrozen ? "text-white/40" : "text-white/85"}`}
        >
          12/2031{"     "}••••• {card?.last4 ?? "••••"}
        </Text>

        {/* Card actions. */}
        <View className="mt-4 flex-row justify-center gap-x-10">
          <CardAction label="Top Up" filled={!isFrozen} disabled={isFrozen} onPress={handleTopUp}>
            <PlusGlyph color={isFrozen ? "#CBD3C1" : colors.zenoDark} />
          </CardAction>
          <CardAction label="View Card" disabled={isFrozen} onPress={() => setCardFlow("details-pin")}>
            <EyeIcon size={22} color={isFrozen ? "#CBD3C1" : colors.zenoGreen} />
          </CardAction>
          <CardAction label="More" onPress={() => { setCardFlow("more"); }}>
            <DotsGlyph color={colors.zenoGreen} />
          </CardAction>
        </View>

        {/* Floating white sheet — paddingBottom covers the nav bar area.
            bounces={false} on the ScrollView prevents overscroll showing the
            dark background, so we only need a small bottom padding here. */}
        <View
          className="mt-7 overflow-hidden rounded-t-[26px] bg-white px-5 pt-5"
          style={{ paddingBottom: 80 }}
        >
          <View className="flex-row items-center justify-between">
            <Text
              allowFontScaling={false}
              className="font-bold text-[24px] text-zeno-text-primary"
            >
              Transactions
            </Text>
            <Pressable onPress={handleSeeAll} hitSlop={10} className="active:opacity-60">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[16px] text-zeno-green-deep"
              >
                See all
              </Text>
            </Pressable>
          </View>

          {cardTransactions.length > 0 ? (
            <View className="mt-1 gap-y-2">
              {cardTransactions.slice(0, 3).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  currency={transaction.currency ?? "USD"}
                />
              ))}
            </View>
          ) : (
            <Text allowFontScaling={false} className="py-5 text-center text-[14px] text-zeno-text-secondary">
              Card transactions will appear here.
            </Text>
          )}
        </View>
      </View>
    </ScrollView>
      <VirtualCardFlowModal
        panel={cardFlow}
        onClose={() => setCardFlow(null)}
        onPanelChange={setCardFlow}
        cardBalance={card?.balance ?? "0.00"}
        fundingWalletBalance={card?.fundingWalletBalance}
        onCardStatusChange={(status) => setIsFrozen(status === "frozen")}
        onBalanceChange={(result: CardBalanceResult) => setCard((current) => current ? {
          ...current,
          balance: result.cardBalance,
          fundingWalletBalance: result.walletBalance.toFixed(2),
        } : current)}
      />
    </View>
  );
}

/** One circular card action with its label — three of them, identical shape. */
function CardAction({
  label,
  filled = false,
  disabled = false,
  onPress,
  children,
}: {
  label: string;
  filled?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      className="items-center active:opacity-70"
    >
      <View
        className={`h-[51px] w-[51px] items-center justify-center ${
          disabled
            ? "bg-[#535D4D]"
            : filled
              ? "bg-zeno-green"
              : "bg-white/10"
        } rounded-full`}
        style={disabled ? {
          width: 51,
          height: 51,
          borderRadius: 25.5,
          backgroundColor: "#535D4D",
        } : undefined}
      >
        {children}
      </View>
      <Text
        allowFontScaling={false}
        className={`mt-2 font-medium text-[13px] ${disabled ? "text-white/65" : "text-white/85"}`}
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
