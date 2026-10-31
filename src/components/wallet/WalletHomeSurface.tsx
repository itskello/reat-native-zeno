import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { BellIcon } from "@/components/ui/BellIcon";
import { WalletHomeSkeleton } from "@/components/ui/Skeleton";
import { TransactionItem } from "@/components/wallet/TransactionItem";
import { WalletHeroCard } from "@/components/wallet/WalletHeroCard";
import { images } from "@/constants/images";
import { gesture, springs } from "@/constants/motion";
import { formatAmount } from "@/data/currencies";
import { isIslandRoom } from "@/data/wallet-screens";
import { useAppStore } from "@/store/app-store";
import { useTransactionStore } from "@/store/transaction-store";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { useWalletStore } from "@/store/wallet-store";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useCallback, useEffect } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
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

import { router } from "expo-router";
import { useNotificationStore } from "@/store/notification-store";

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
  /**
   * Scroll-driven collapse progress (0 = top, 1 = fully collapsed).
   * Used to fade out the greeting block as it migrates into the Dynamic Island.
   */
  collapse: SharedValue<number>;
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
  collapse,
}: WalletHomeSurfaceProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const currency = useAppStore((s) => s.selectedCurrency);
  const wallet = useWalletStore((s) => s.wallet);
  const isLoading = useWalletStore((s) => s.isLoading);
  const isBalanceHidden = useWalletStore((s) => s.isBalanceHidden);
  const toggleBalanceVisibility = useWalletStore(
    (s) => s.toggleBalanceVisibility
  );
  const transactions = useTransactionStore((s) => s.transactions);
  // Only re-render when island-room state changes, not on every nav change
  const isIslandActive = useWalletNav((s) => isIslandRoom(s.current));
  const navigateTo = useWalletNav((s) => s.navigateTo);

  const firstName = user?.firstName ?? "there";
  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatarPlaceholder;

  const balanceLabel = formatAmount(wallet?.balance ?? 0, currency);

  // Stable callbacks — prevent WalletHeroCard and TransactionItem from re-rendering
  // every time scrollY, collapse, or any other shared value changes.
  const goProfile = useCallback(() => router.push("/profile"), []);
  const goNotifications = useCallback(() => router.push("/notifications"), []);
  const goTransactions = useCallback(() => navigateTo("TRANSACTIONS"), [navigateTo]);
  const goAdd = useCallback(() => navigateTo("ADD"), [navigateTo]);
  const goWithdraw = useCallback(() => navigateTo("WITHDRAW"), [navigateTo]);
  const goSend = useCallback(() => navigateTo("SEND"), [navigateTo]);
  const goGetPaid = useCallback(() => navigateTo("GETPAID"), [navigateTo]);

  const unreadCount = useNotificationStore((s) => s.unreadCount);

  /** Set on gesture begin: whether this pan is allowed to open the card. */
  const canOpen = useSharedValue(false);
  /**
   * SharedValue mirror of isIslandActive — readable inside Reanimated worklets.
   * Gesture callbacks run on the UI thread and cannot read React/Zustand state.
   */
  const isIslandActiveSV = useSharedValue(isIslandActive ? 1 : 0);

  // Island rooms (ZENO Card, Send Money) are the `islande model`, so opening
  // one means driving the morph — whether it was reached by the pull-down
  // gesture or by tapping an action on the hero.
  useEffect(() => {
    cardDragY.value = withSpring(isIslandActive ? 300 : 0, springs.liquid);
    isIslandActiveSV.value = isIslandActive ? 1 : 0;
  }, [isIslandActive, isIslandActiveSV]);

  // Pull-down gesture from Home opens ZENO Card. It is only allowed while the
  // list is at the very top, otherwise it fights the native scroll and can
  // open the card while the island is faded out by the scroll collapse.
  const openCardGesture = Gesture.Pan()
    .activeOffsetY(20)
    .failOffsetY(-10)
    .onBegin(() => {
      canOpen.value = isIslandActiveSV.value === 0 && scrollY.value <= 1;
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
      opacity: 1,
      transform: [{ translateY }, { scale }],
    };
  });

  /** Greeting block fades out as collapse increases (it migrates into the island). */
  const greetingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(collapse.value, [0, 0.5], [1, 0], "clamp"),
  }));

  // Show skeleton while wallet data is loading
  if (isLoading) {
    return (
      <Animated.View className="flex-1" style={[animatedHomeStyle, { paddingTop: contentTopGap }]}>
        <WalletHomeSkeleton />
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={openCardGesture}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={[animatedHomeStyle]}
        contentContainerStyle={{
          paddingTop: contentTopGap,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 20,
        }}
      >
        {/* Greeting block — fades out as it migrates into the Dynamic Island. */}
        <Animated.View style={greetingStyle} className="flex-row items-center justify-between">
          <Pressable
            onPress={goProfile}
            className="flex-row items-center flex-1 pr-3"
            hitSlop={8}
          >
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
          </Pressable>
          <Pressable
            onPress={goNotifications}
            hitSlop={8}
            className="relative h-[48px] w-[48px] items-center justify-center rounded-full bg-white shadow-low"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <BellIcon size={24} color="#0057FF" />
            {unreadCount > 0 && (
              <View className="absolute top-[8px] right-[8px] h-[9px] w-[9px] rounded-full bg-[#EF4444] border-[1.5px] border-white" />
            )}
          </Pressable>
        </Animated.View>

        {/* Wallet hero. */}
        <View className="mt-6">
          <WalletHeroCard
            balanceLabel={balanceLabel}
            isBalanceHidden={isBalanceHidden}
            onToggleVisibility={toggleBalanceVisibility}
            onAddMoney={goAdd}
            onWithdraw={goWithdraw}
            onSend={goSend}
            onGetPaid={goGetPaid}
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
          <Pressable hitSlop={8} onPress={goTransactions}>
            <Text
              allowFontScaling={false}
              className="font-medium text-[14px] text-zeno-link-blue"
            >
              See all
            </Text>
          </Pressable>
        </View>

        <View className="mt-4 gap-y-2.5">
          {transactions.slice(0, 5).map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              currency={currency}
              onPress={goTransactions}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </GestureDetector>
  );
}
