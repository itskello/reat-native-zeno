import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { ArrowRightIcon, NoConversationsIcon } from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { getAuthenticated } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConversationSummary = {
  id: string;
  status: "ai" | "waiting" | "human";
  lastMessage: string;
  updatedAt: string | null;
};

export default function SupportMessagesScreen() {
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  // Clerk may return a new getToken function as the auth context updates.
  // Keep it out of the focus callback dependencies so a state update cannot
  // restart the request and flash the whole Messages screen back to loading.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useFocusEffect(useCallback(() => {
    let active = true;
    void (async () => {
      if (!isLoaded || !isSignedIn) {
        if (active) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const token = await getTokenRef.current();
        if (!token) {
          if (active) setLoadError(language === "fr" ? "Session expirée. Reconnecte-toi." : "Your session expired. Please sign in again.");
          return;
        }
        const result = await getAuthenticated<{ conversation: ConversationSummary | null }>("/api/support/conversation", token);
        if (result.ok && active) {
          setConversation(result.data.conversation);
          setLoadError("");
        } else if (!result.ok && active) {
          setLoadError(result.error);
        }
      } catch {
        if (active) setLoadError("Impossible de charger la conversation.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [isLoaded, isSignedIn, language]));

  const statusLabel = !conversation ? "" : language === "en"
    ? conversation.status === "human" ? "An agent is replying" : conversation.status === "waiting" ? "Waiting for support" : "ZENO Assistant"
    : conversation.status === "human" ? "Un agent vous répond" : conversation.status === "waiting" ? "En attente de l’équipe" : "Assistant ZENO";

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-5">
        <View className="flex-row items-center gap-x-4 pt-3 pb-2">
          <Pressable className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low" onPress={() => router.back()} hitSlop={12}>
            <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
          </Pressable>
          <Text allowFontScaling={false} className="text-[22px] font-bold text-zeno-text-primary">Messages</Text>
        </View>

        {loading ? <View className="flex-1 items-center justify-center"><ActivityIndicator color="#0A1712" /></View> : loadError ? <View className="flex-1 items-center justify-center"><Text className="px-6 text-center text-[14px] text-zeno-text-secondary">{loadError}</Text></View> : conversation ? <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}>
          <View className="rounded-[24px] border border-gray-100/60 bg-white p-5 shadow-low">
            <View className="flex-row items-center gap-x-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#0A1712]"><Image source={images.logoWhite} style={{ width: 24, height: 15 }} contentFit="contain" /></View>
              <View className="flex-1">
                <Text allowFontScaling={false} className="text-[16px] font-bold text-zeno-text-primary">Assistance ZENO</Text>
                <Text allowFontScaling={false} className="mt-0.5 text-[12px] text-zeno-text-secondary">{statusLabel}</Text>
              </View>
            </View>
            <Text allowFontScaling={false} numberOfLines={3} className="mt-4 text-[14px] leading-[21px] text-zeno-text-secondary">{conversation.lastMessage || (language === "fr" ? "Conversation ouverte" : "Conversation started")}</Text>
            <Pressable onPress={() => router.push({ pathname: "/settings/support-chat", params: { conversationId: conversation.id } })} className="mt-4 h-12 flex-row items-center justify-center gap-x-2 rounded-full bg-[#0A1712]">
              <Text allowFontScaling={false} className="font-bold text-white">{language === "fr" ? "Reprendre la conversation" : "Resume conversation"}</Text>
              <ArrowRightIcon size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView> : <View className="flex-1 items-center justify-center pb-16">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-gray-100"><NoConversationsIcon size={56} color="#9CA3AF" /></View>
          <Text allowFontScaling={false} className="mb-2 text-center text-[20px] font-bold text-zeno-text-primary">{language === "fr" ? "Pas encore de message" : "No messages yet"}</Text>
          <Text allowFontScaling={false} className="px-6 text-center text-[14px] font-medium leading-[22px] text-zeno-text-secondary">{language === "fr" ? "Écris à l’assistance ZENO pour démarrer ta conversation." : "Message ZENO Support to start your conversation."}</Text>
          <Pressable onPress={() => router.push("/settings/support-chat")} className="mt-8 h-[52px] flex-row items-center justify-center gap-x-3 rounded-full bg-[#0A1712] px-8 shadow-md" style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Text allowFontScaling={false} className="text-[16px] font-bold text-white">{language === "fr" ? "Contacter l'assistance" : "Contact support"}</Text>
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </Pressable>
        </View>}
      </View>
    </View>
  );
}
