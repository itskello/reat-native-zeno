import { BellIcon } from "@/components/ui/BellIcon";
import { TransactionItem } from "@/components/wallet/TransactionItem";
import { WalletHeroCard } from "@/components/wallet/WalletHeroCard";
import { images } from "@/constants/images";
import { gesture, springs } from "@/constants/motion";
import { formatAmount } from "@/data/currencies";
import { useAppStore } from "@/store/app-store";
import { useTransactionStore } from "@/store/transaction-store";
import { useWalletNav } from "@/store/wallet-nav";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletStore } from "@/store/wallet-store";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WalletHomeSurfaceProps = {
  /**
   * Scroll handler owned by the navigator — it drives the Dynamic Island
   * collapse, so the capsule shrinks in sync with this content.
   */
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  /** Live scroll offset — the open-card gesture is only allowed at the top. */
  scrollY: SharedValue<number>;
  /** Distance (px) between the screen top and the first content row. */
  contentTopGap: number;
};

/**
 * Wallet Home — the root room of the Wallet ecosystem.
 *
 * It renders the greeting, the ZENO-Blue hero (balance + primary actions) and
 * the floating transaction cards. It owns no transitions: tapping an action
 * calls `navigateTo`, and swiping down opens the ZENO Card. The navigator
 * animates whatever room that produces.
 */
export function WalletHomeSurface({
  onScroll,
  scrollY,
  contentTopGap,
}: WalletHomeSurfaceProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const currency = useAppStore((s) => s.selectedCurrency);
  const wallet = useWalletStore((s) => s.wallet);
  const isBalanceHidden = useWalletStore((s) => s.isBalanceHidden);
  const toggleBalanceVisibility = useWalletStore(
    (s) => s.toggleBalanceVisibility
  );
  const transactions = useTransactionStore((s) => s.transactions);
  const current = useWalletNav((s) => s.current);
  const navigateTo = useWalletNav((s) => s.navigateTo);

  const firstName = user?.firstName ?? "there";
  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatarPlaceholder;

  const balanceLabel = formatAmount(wallet?.balance ?? 0, currency);

  /** Set on gesture begin: whether this pan is allowed to open the card. */
  const canOpen = useSharedValue(false);

  useEffect(() => {
    if (current === "HOME") {
      cardDragY.value = withSpring(0, springs.liquid);
    } else if (current === "CARD") {
      cardDragY.value = withSpring(300, springs.liquid);
    }
  }, [current]);

  // Pull-down gesture from Home opens ZENO Card. It is only allowed while the
  // list is at the very top, otherwise it fights the native scroll and can
  // open the card while the island is faded out by the scroll collapse.
  const openCardGesture = Gesture.Pan()
    .activeOffsetY(20)
    .failOffsetY(-10)
    .onBegin(() => {
      canOpen.value = current === "HOME" && scrollY.value <= 1;
    })
    .onUpdate((event) => {
      if (canOpen.value && event.translationY > 0) {
        cardDragY.value = Math.min(350, event.translationY);
      }
    })
    .onFinalize((event, success) => {
      if (!canOpen.value) return;
      canOpen.value = false;

      if (
        success &&
        (event.translationY > gesture.distanceThreshold ||
          event.velocityY > gesture.velocityThreshold)
      ) {
        cardDragY.value = withSpring(300, springs.liquid);
        runOnJS(navigateTo)("CARD");
        return;
      }
      cardDragY.value = withSpring(0, springs.liquid);
    });

  const animatedHomeStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      cardDragY.value,
      [0, 300],
      [0, windowHeight * 0.85],
      "clamp"
    );
    const scale = interpolate(cardDragY.value, [0, 300], [1, 0.94], "clamp");

    return {
      opacity: 1, // NO OPACITY FADE: Wallet Home remains 100% solid as it slides down out of view
      transform: [{ translateY }, { scale }],
    };
  });

  return (
    <GestureDetector gesture={openCardGesture}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={[animatedHomeStyle]}
        contentContainerStyle={{
          paddingTop: contentTopGap,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
      >
        {/* Greeting block. */}
        <View className="flex-row items-center">
          <Image
            source={avatarSource}
            style={{ width: 48, height: 48, borderRadius: 24 }}
            contentFit="cover"
          />
          <View className="ml-3 flex-1">
            <Text
              allowFontScaling={false}
              className="font-medium text-[14px] text-zeno-text-secondary"
            >
              Welcome Back
            </Text>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="font-semibold text-[20px] text-zeno-text-primary"
            >
              Hey {firstName}
            </Text>
          </View>
          <View className="h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-low">
            <BellIcon size={24} color="#0057FF" />
          </View>
        </View>

        {/* Wallet hero. */}
        <View className="mt-6">
          <WalletHeroCard
            balanceLabel={balanceLabel}
            isBalanceHidden={isBalanceHidden}
            onToggleVisibility={toggleBalanceVisibility}
            onAddMoney={() => navigateTo("ADD")}
            onWithdraw={() => navigateTo("WITHDRAW")}
            onSend={() => navigateTo("SEND")}
            onGetPaid={() => navigateTo("GETPAID")}
          />
        </View>

        {/* Transactions section. */}
        <View className="mt-5 flex-row items-center justify-between">
          <Text
            allowFontScaling={false}
            className="font-semibold text-[20px] text-zeno-text-primary"
          >
            Transactions
          </Text>
          <Pressable hitSlop={8} onPress={() => navigateTo("TRANSACTIONS")}>
            <Text
              allowFontScaling={false}
              className="font-medium text-[14px] text-zeno-link-blue"
            >
              See all
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 gap-y-2.5">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              currency={currency}
              onPress={() => navigateTo("TRANSACTIONS")}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </GestureDetector>
  );
}
