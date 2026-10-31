import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { ArrowRightIcon, HelpCircleIcon, MessageChatIcon, SearchIcon } from "@/components/ui/ProfileIcons";
import { PersonPlusIcon } from "@/components/ui/PersonPlusIcon";
import { images } from "@/constants/images";
import { getAuthenticated } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function XIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" /></Svg>;
}

type SupportItem = {
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  route: "/settings/support-help" | "/settings/support-search" | "/settings/support-messages" | "/settings/support-chat" | "/settings/referral";
};

const PRIMARY_ITEMS: SupportItem[] = [
  { label: "Aide", Icon: HelpCircleIcon, route: "/settings/support-help" },
  { label: "Messages", Icon: MessageChatIcon, route: "/settings/support-messages" },
];

const SEARCH_ITEMS: SupportItem[] = [
  { label: "Trouver une réponse", Icon: SearchIcon, route: "/settings/support-search" },
];

const OTHER_ITEMS: SupportItem[] = [
  { label: "Contacter l'assistance", Icon: ArrowRightIcon, route: "/settings/support-chat" },
  { label: "Parrainage", Icon: PersonPlusIcon, route: "/settings/referral" },
];

type RecentConversation = {
  id: string;
  lastMessage: string;
  lastMessageSender: "assistant" | "customer" | "agent" | null;
  updatedAt: string | null;
};

function formatRecentTime(dateValue: string | null, language: "fr" | "en") {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (elapsedMinutes < 1) return language === "fr" ? "À l’instant" : "Just now";
  if (elapsedMinutes < 60) return language === "fr" ? `Il y a ${elapsedMinutes} min` : `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return language === "fr" ? `Il y a ${elapsedHours} h` : `${elapsedHours} hr ago`;
  return date.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" });
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [recentConversation, setRecentConversation] = useState<RecentConversation | null>(null);
  const firstName = user?.firstName?.trim();

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        if (!token) return;
        const response = await getAuthenticated<{ conversation: RecentConversation | null }>("/api/support/conversation", token);
        if (response.ok && active) {
          const recent = response.data.conversation;
          setRecentConversation(recent?.lastMessage.trim() ? recent : null);
        }
      } catch {
        if (active) setRecentConversation(null);
      }
    })();
    return () => { active = false; };
  }, [getToken, isLoaded, isSignedIn]));

  const recentSender = recentConversation?.lastMessageSender === "customer"
    ? (language === "fr" ? "Toi" : "You")
    : recentConversation?.lastMessageSender === "assistant"
      ? (language === "fr" ? "Assistant ZENO" : "ZENO Assistant")
      : (language === "fr" ? "Équipe ZENO" : "ZENO Support");

  const renderItems = (items: SupportItem[]) => items.map((item, index) => (
    <Pressable
      key={item.label}
      onPress={() => router.push(item.route as Href)}
      className={`flex-row items-center justify-between px-5 py-[18px] ${index > 0 ? "border-t border-gray-100" : ""}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      <Text allowFontScaling={false} className="text-[16px] font-semibold text-zeno-text-primary">{item.label}</Text>
      <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]"><item.Icon size={20} color="#0F7153" /></View>
    </Pressable>
  ));

  return (
    <View className="flex-1 bg-[#F4FAFF]">
      <View className="bg-[#0A1712] px-5" style={{ paddingTop: insets.top + 16, paddingBottom: 36 }}>
        <View className="mb-9 flex-row items-center justify-between">
          <Image source={images.logoWhite} style={{ width: 44, height: 28 }} contentFit="contain" />
          <Pressable onPress={() => router.back()} className="h-9 w-9 items-center justify-center rounded-full bg-white/15" style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <XIcon size={16} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text allowFontScaling={false} className="text-[28px] font-bold leading-[38px] text-white">
          {language === "fr" ? `Bonjour${firstName ? ` ${firstName}` : ""} 👋\nComment pouvons-nous\nt’aider ?` : `Hello${firstName ? ` ${firstName}` : ""} 👋\nHow can we\nhelp you?`}
        </Text>
      </View>

      <ScrollView className="z-10 -mt-10 flex-1" style={{ elevation: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
        <View className="overflow-hidden rounded-[28px] border border-gray-100/60 bg-white shadow-low">
          {renderItems(PRIMARY_ITEMS)}
        </View>

        {recentConversation ? <Pressable onPress={() => router.push({ pathname: "/settings/support-chat", params: { conversationId: recentConversation.id } })} className="mt-3 rounded-[24px] border border-gray-100/60 bg-white p-5 shadow-low" style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Text allowFontScaling={false} className="mb-4 text-[16px] font-bold text-zeno-text-primary">{language === "fr" ? "Message récent" : "Recent message"}</Text>
          <View className="flex-row items-center gap-x-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#0A1712]"><Image source={images.logoWhite} style={{ width: 22, height: 14 }} contentFit="contain" /></View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center justify-between gap-x-2">
                <Text allowFontScaling={false} numberOfLines={1} className="flex-1 text-[15px] font-semibold text-zeno-text-primary">{recentSender}</Text>
                <Text allowFontScaling={false} className="text-[12px] font-medium text-zeno-text-secondary">{formatRecentTime(recentConversation.updatedAt, language)}</Text>
              </View>
              <Text allowFontScaling={false} numberOfLines={1} className="mt-0.5 text-[14px] text-zeno-text-secondary">{recentConversation.lastMessage}</Text>
            </View>
          </View>
        </Pressable> : null}

        <View className="mt-3 overflow-hidden rounded-[28px] border border-gray-100/60 bg-white shadow-low">
          {renderItems(SEARCH_ITEMS)}
        </View>

        <View className="mt-3 overflow-hidden rounded-[28px] border border-gray-100/60 bg-white shadow-low">
          {renderItems(OTHER_ITEMS)}
        </View>
      </ScrollView>
    </View>
  );
}
