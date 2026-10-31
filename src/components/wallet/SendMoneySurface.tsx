import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { Chevron } from "@/components/ui/Chevron";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { PersonPlusIcon } from "@/components/ui/PersonPlusIcon";
import { TransferFlow } from "@/features/transfers/TransferFlow";
import { images } from "@/constants/images";
import { springs } from "@/constants/motion";
import { getFinancialTitleSegments } from "@/lib/localization";
import { useRecipientStore, type Recipient } from "@/store/recipient-store";
import { transferService } from "@/features/transfers/transfer-service";
import { cardDragY } from "@/store/wallet-gesture";
import { useWalletNav } from "@/store/wallet-nav";
import { useLanguageStore } from "@/store/language-store";
import { colors } from "@/theme/colors";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text as NativeText, View } from "react-native";
import { withSpring } from "react-native-reanimated";

type SendMoneySurfaceProps = {
  contentTopGap: number;
};

const LOGO_ASPECT = 3380 / 1424;

/**
 * Send Money surface (SEND room).
 *
 * Rendered inside the Dynamic Island's `islande model`, exactly like the ZENO
 * Card, so the room shares the one island-scale morph instead of getting its
 * own transition. Consequences for this file:
 *
 * - the layout is authored at full-screen size and anchored top-left, because
 *   the island scales it up from its own top-left corner;
 * - it paints no background — the island's liquid shape is the dark hero, and
 *   an opaque rect here would cover the siphon neck with a hard edge.
 */
export function SendMoneySurface({ contentTopGap }: SendMoneySurfaceProps) {
  const language = useLanguageStore((state) => state.language);
  const [titleMuted, titleStrong] = getFinancialTitleSegments("sendMoney", language);
  const sendSubtitle = language === "fr" ? "Choisissez comment" : "Choose how to";
  const goHome = useWalletNav((s) => s.goHome);
  const recent = useRecipientStore((s) => s.recent);
  const setRecipients = useRecipientStore((s) => s.setRecipients);
  const { getToken, userId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [flow, setFlow] = useState<"zeno" | "mobile" | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | undefined>();

  useEffect(() => {
    let isCurrent = true;
    setRecipients([]);
    void (async () => {
      try {
        const token = await getTokenRef.current();
        if (!token || !isCurrent) return;
        const result = await transferService.listRecipients(token);
        if (isCurrent && result.ok) setRecipients(result.data.recipients);
      } catch {
        // Loading contacts is best effort; keep the surface usable if it fails.
      }
    })();
    return () => { isCurrent = false; };
  }, [setRecipients, userId]);

  const close = () => {
    cardDragY.value = withSpring(0, springs.liquid);
    goHome();
  };

  // The island room now closes only through the dismiss button, so its inner
  // content can be scrolled and the user keeps full control of the room.

  const openZenoUserFlow = (recipient?: Recipient) => {
    setSelectedRecipient(recipient);
    setFlow("zeno");
  };
  const openMobileMoneyFlow = () => {
    setSelectedRecipient(undefined);
    setFlow("mobile");
  };
  const openAddRecipient = () => openZenoUserFlow();

  if (flow) {
    return (
      <TransferFlow
        contentTopGap={contentTopGap}
        flow={flow}
        initialRecipient={selectedRecipient}
        onBackToMenu={() => setFlow(null)}
      />
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingTop: contentTopGap, paddingBottom: 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1">
        {/* Dismiss cross, right aligned above the title. */}
        <View className="h-[34px] flex-row justify-end px-11">
          <Pressable
            onPress={close}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Close Send Money"
            className="active:opacity-60"
          >
            <CloseIcon size={26} color="rgba(255,255,255,0.45)" />
          </Pressable>
        </View>

        {/* Title — first word dimmed, second emphasised (locked typography). */}
        <View className="mt-4 flex-row items-baseline px-11">
          <NativeText
            allowFontScaling={false}
            className="font-semibold text-[32px] text-white/40"
          >
            {titleMuted}{" "}
          </NativeText>
          <NativeText
            allowFontScaling={false}
            className="font-bold text-[32px] text-white"
          >
            {titleStrong}
          </NativeText>
        </View>

        <NativeText
          allowFontScaling={false}
          className="mt-9 px-11 text-[24px] leading-[27px] text-white/85"
        >
          {sendSubtitle}
        </NativeText>

        {/* The three ways to send. */}
        <View className="mt-11 px-11">
          <SendOption
            title="ZENO User"
            subtitle="Instant transfer"
            badge="Free"
            circleColor={colors.zenoBlue}
            onPress={() => openZenoUserFlow()}
          >
            <Image
              source={images.logoWhite}
              style={{ height: 13, width: 13 * LOGO_ASPECT }}
              contentFit="contain"
            />
          </SendOption>

          <SendOption
            title="Mobile Money"
            subtitle={language === "fr" ? "Vers n’importe quel numéro" : "Send to any number"}
            circleColor={colors.zenoGreen}
            onPress={openMobileMoneyFlow}
          >
            <Image
              source={images.requestMoney}
              style={{ width: 28, height: 28 }}
              contentFit="contain"
              tintColor={colors.zenoDark}
            />
          </SendOption>

          <SendOption
            title="Withdraw Money"
            subtitle="To Mobile Money"
            circleColor={colors.zenoMint}
            onPress={() => useWalletNav.getState().navigateTo("WITHDRAW")}
          >
            <Image
              source={images.withdraw}
              style={{ width: 27, height: 27 }}
              contentFit="contain"
              tintColor={colors.zenoDark}
            />
          </SendOption>
        </View>

        {/* Recent recipients — tapping one skips the search step. */}
        <View className="mt-8">
          <View className="flex-row items-baseline px-11">
            <Text
              allowFontScaling={false}
              className="font-bold text-[30px] text-white/25"
            >
              Recent{" "}
            </Text>
            <Text
              allowFontScaling={false}
              className="text-[16px] text-white/60"
            >
              Recipients
            </Text>
          </View>

          <View className="mt-5 flex-row px-11">
            {recent.map((recipient, index) => (
              <Pressable
                key={recipient.id}
                onPress={() => openZenoUserFlow(recipient)}
                accessibilityRole="button"
                accessibilityLabel={`Send money to ${recipient.name}`}
                className={`items-center active:opacity-70 ${
                  index > 0 ? "ml-6" : ""
                }`}
              >
                <Image
                  source={{ uri: recipient.avatarUrl }}
                  style={{ width: 59, height: 59, borderRadius: 30 }}
                  contentFit="cover"
                />
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  className="mt-2 text-[14px] text-white/75"
                >
                  {recipient.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Add New Recipient — light pill on the dark hero. */}
        <View className="mb-10 mt-8 px-10">
          <Pressable
            onPress={openAddRecipient}
            accessibilityRole="button"
            accessibilityLabel={language === "fr" ? "Ajouter un bénéficiaire" : "Add New Recipient"}
            className="h-[54px] flex-row items-center rounded-full bg-zeno-sky pl-1.5 pr-6 active:opacity-90"
          >
            <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-zeno-mint-soft">
              <PersonPlusIcon size={23} color={colors.zenoDark} />
            </View>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="ml-3 min-w-0 flex-1 font-bold text-[16px] text-zeno-text-primary"
            >
              Add New Recipient
            </Text>
            <Chevron direction="right" size={11} color={colors.zenoDark} thickness={2.4} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * One "how do you want to send" row: coloured icon circle, title with an
 * optional badge, subtitle, chevron. Three of them, identical shape.
 */
function SendOption({
  title,
  subtitle,
  badge,
  circleColor,
  onPress,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  circleColor: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      className="mb-7 flex-row items-center active:opacity-70"
    >
      <View
        className="h-[58px] w-[58px] items-center justify-center rounded-full border border-black/20"
        style={{ backgroundColor: circleColor }}
      >
        {children}
      </View>

      <View className="ml-5 flex-1">
        <View className="flex-row items-center">
          <Text
            allowFontScaling={false}
            className="font-semibold text-[21px] text-white"
          >
            {title}
          </Text>
          {badge ? (
            <View className="ml-3 rounded-full bg-zeno-green px-2.5 py-[3px]">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[12px] text-zeno-dark"
              >
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          allowFontScaling={false}
          className="mt-1 text-[12.5px] text-white/65"
        >
          {subtitle}
        </Text>
      </View>

      <Chevron direction="right" size={13} color="#FFFFFF" thickness={2.6} />
    </Pressable>
  );
}
