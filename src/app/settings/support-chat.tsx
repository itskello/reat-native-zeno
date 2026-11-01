import { LocalizedText as Text, LocalizedTextInput as TextInput, showLocalizedAlert } from "@/components/ui/LocalizedText";
import { ZenoLoading } from "@/components/ui/ZenoLoading";
import { SendUpIcon } from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { postAuthenticated } from "@/lib/api";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/expo";
import { StreamChat, type Channel, type Event, type LocalMessage, type MessageResponse } from "stream-chat";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type ConversationCredentials = {
  apiKey: string;
  token: string;
  userId: string;
  userName?: string;
  channelId: string;
  status: "ai" | "waiting" | "human";
};

type ChatLine = {
  id: string;
  text: string;
  isCurrentUser: boolean;
  isAssistant: boolean;
  createdAt: Date;
};

const supportCredentialRequests = new Map<string, Promise<ConversationCredentials>>();
const supportConnectionRequests = new Map<string, Promise<void>>();
const supportChannelWatchRequests = new Map<string, Promise<void>>();

function loadSupportCredentials(userId: string, sessionToken: string, conversationId?: string) {
  const requestKey = `${userId}:${conversationId ?? "primary"}`;
  const pending = supportCredentialRequests.get(requestKey);
  if (pending) return pending;

  const request = postAuthenticated<ConversationCredentials>("/api/support/conversation", sessionToken, { conversationId })
    .then((response) => {
      if (!response.ok) throw new Error(response.error);
      return response.data;
    })
    .finally(() => {
      if (supportCredentialRequests.get(requestKey) === request) supportCredentialRequests.delete(requestKey);
    });
  supportCredentialRequests.set(requestKey, request);
  return request;
}

async function connectSupportUser(client: StreamChat, info: ConversationCredentials) {
  const connectionKey = `${info.apiKey}:${info.userId}`;
  let pending = supportConnectionRequests.get(connectionKey);
  if (pending) return pending;
  if (client.userID === info.userId) return;
  if (client.userID) await client.disconnectUser();

  pending = client.connectUser(
    { id: info.userId, ...(info.userName ? { name: info.userName } : {}) },
    info.token,
  ).then(() => undefined).finally(() => {
    if (supportConnectionRequests.get(connectionKey) === pending) supportConnectionRequests.delete(connectionKey);
  });
  supportConnectionRequests.set(connectionKey, pending);
  await pending;
}

async function watchSupportChannel(client: StreamChat, info: ConversationCredentials) {
  const channel = client.channel("messaging", info.channelId);
  const watchKey = `${info.apiKey}:${info.userId}:${info.channelId}`;
  let pending = supportChannelWatchRequests.get(watchKey);
  if (!pending) {
    pending = channel.watch().then(() => undefined).finally(() => {
      if (supportChannelWatchRequests.get(watchKey) === pending) supportChannelWatchRequests.delete(watchKey);
    });
    supportChannelWatchRequests.set(watchKey, pending);
  }
  await pending;
  return channel;
}

function BackArrowIcon({ size = 20, color = "#071706" }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M12 5l-7 7 7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function toChatLine(message: MessageResponse | LocalMessage, userId: string): ChatLine | null {
  if (!message.id || !message.text || !message.created_at) return null;
  return {
    id: message.id,
    text: message.text,
    isCurrentUser: message.user?.id === userId,
    isAssistant: message.user?.id === "zeno_gemini_assistant",
    createdAt: new Date(message.created_at),
  };
}

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { prefillMessage, conversationId: requestedConversationId } = useLocalSearchParams<{ prefillMessage?: string; conversationId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const channelRef = useRef<Channel | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [inputText, setInputText] = useState("");
  const [credentials, setCredentials] = useState<ConversationCredentials | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [requestingAgent, setRequestingAgent] = useState(false);
  const initialMessageSent = useRef(false);

  const connectConversation = useCallback(async () => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) {
      setError("Connecte-toi pour contacter l’assistance.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const sessionToken = await getTokenRef.current();
      if (!sessionToken) throw new Error("Connecte-toi pour contacter l’assistance.");
      const info = await loadSupportCredentials(userId, sessionToken, requestedConversationId);
      const client = StreamChat.getInstance(info.apiKey);
      await connectSupportUser(client, info);
      const channel = await watchSupportChannel(client, info);
      channelRef.current = channel;
      setCredentials(info);
      setLines(channel.state.messages.map((message) => toChatLine(message, info.userId)).filter((line): line is ChatLine => Boolean(line)));
      setStatus("ready");

      const subscription = channel.on("message.new", (event: Event) => {
        const line = event.message ? toChatLine(event.message, info.userId) : null;
        if (line) setLines((current) => current.some((item) => item.id === line.id) ? current : [...current, line]);
      });
      const statusSubscription = channel.on("channel.updated", (event: Event) => {
        const updated = event.channel as Record<string, unknown> | undefined;
        if (updated?.support_status === "human" || updated?.support_status === "waiting") {
          setCredentials((current) => current ? { ...current, status: updated.support_status as "waiting" | "human" } : current);
        }
      });
      return () => {
        subscription.unsubscribe();
        statusSubscription.unsubscribe();
      };
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de joindre l’assistance.");
      setStatus("error");
    }
  }, [isLoaded, isSignedIn, userId, requestedConversationId]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;
    void connectConversation().then((dispose) => {
      if (active) cleanup = dispose;
      else dispose?.();
    });
    return () => {
      active = false;
      cleanup?.();
    };
  }, [connectConversation]);

  useEffect(() => {
    if (status !== "ready" || initialMessageSent.current || !prefillMessage?.trim()) return;
    initialMessageSent.current = true;
    void sendMessage(prefillMessage.trim());
    // A route parameter is intentionally sent once after the real channel is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, prefillMessage]);

  const sendMessage = useCallback(async (value: string) => {
    const text = value.trim();
    const channel = channelRef.current;
    if (!text || !channel || sending) return;
    setSending(true);
    setInputText("");
    let delivered = false;
    try {
      const sent = await channel.sendMessage({ text });
      delivered = true;
      if (credentials?.status === "ai") {
        const sessionToken = await getTokenRef.current();
        if (!sessionToken) throw new Error("Session expirée. Reconnecte-toi.");
        const response = await postAuthenticated<{ answered?: boolean; handedOff?: boolean }>("/api/support/assistant", sessionToken, { channelId: credentials.channelId, messageId: sent.message.id, language });
        if (!response.ok) throw new Error(response.error);
      }
    } catch {
      if (!delivered) {
        setInputText(text);
        showLocalizedAlert("Message non envoyé", "Vérifie ta connexion puis réessaie.");
      } else {
        showLocalizedAlert("Assistant indisponible", "Ton message est envoyé. Tu peux demander à parler à un agent.");
      }
    } finally {
      setSending(false);
    }
  }, [credentials, language, sending]);

  const requestHumanAgent = useCallback(async () => {
    const sessionToken = await getTokenRef.current();
    if (!sessionToken || !credentials) return;
    setRequestingAgent(true);
    try {
      const channel = channelRef.current;
      if (channel) await channel.sendMessage({ text: language === "fr" ? "Je souhaite parler à un agent." : "I’d like to speak with a support agent." });
      const response = await postAuthenticated<{ status: "waiting" }>("/api/support/handoff", sessionToken, { channelId: credentials.channelId });
      if (!response.ok) throw new Error(response.error);
      setCredentials((current) => current ? { ...current, status: "waiting" } : current);
    } catch (cause) {
      showLocalizedAlert("Demande non envoyée", cause instanceof Error ? cause.message : "Réessaie dans un instant.");
    } finally {
      setRequestingAgent(false);
    }
  }, [credentials, language]);

  const formatTime = (date: Date) => date.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" });
  const suggestedMessages = language === "fr"
    ? ["Vérifier mon identité", "Ajouter de l’argent", "Afficher la devise du compte", "Envoyer de l’argent", "Faire un retrait", "Carte ZENO", "Créer un lien de paiement", "Demander de l’argent ou un QR", "Problème de paiement ou remboursement", "Compte restreint", "Parler à un agent"]
    : ["Verify my identity", "Add money", "Account currency", "Send money", "Withdraw money", "ZENO Card", "Create a payment link", "Request money or a QR", "Payment or refund problem", "Restricted account", "Talk to an agent"];

  return (
    <KeyboardAvoidingView className="flex-1 bg-[#F4FAFF]" behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0} style={{ paddingBottom: insets.bottom }}>
      <View className="flex-row items-center gap-x-3 border-b border-gray-100 bg-white px-4" style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
        <Pressable className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#F4FAFF]" onPress={() => router.back()} hitSlop={12}>
          <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
        </Pressable>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#0A1712]">
          <Image source={images.logoWhite} style={{ width: 22, height: 14 }} contentFit="contain" />
        </View>
        <View className="flex-1">
          <Text allowFontScaling={false} className="text-[16px] font-bold text-zeno-text-primary">ZENO</Text>
          <Text allowFontScaling={false} className="mt-0.5 text-[12px] font-medium text-zeno-text-secondary">{credentials?.status === "human" ? "Un agent vous répond" : credentials?.status === "waiting" ? "En attente de l’équipe" : "Assistant ZENO"}</Text>
        </View>
      </View>

      {status === "ready" && lines.length === 0 ? <View className="items-center border-b border-gray-100 bg-white py-3">
        <Text allowFontScaling={false} className="text-[14px] font-medium text-zeno-text-secondary">{language === "fr" ? "En quoi puis-je t’aider ? 💡" : "How can I help? 💡"}</Text>
      </View> : null}

      <ScrollView ref={scrollRef} className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, flexGrow: 1 }} onContentSizeChange={() => { if (lines.length > 0) scrollRef.current?.scrollToEnd({ animated: true }); }}>
        {status === "loading" && <View className="flex-1 items-center justify-center"><ZenoLoading variant="blue" size={24} /><Text className="mt-1 text-[14px] text-zeno-text-secondary">{language === "fr" ? "Connexion à l’assistance…" : "Connecting to support…"}</Text></View>}
        {status === "error" && <View className="flex-1 items-center justify-center px-5"><Text className="text-center text-[15px] font-medium text-zeno-text-primary">{error}</Text><Pressable onPress={() => void connectConversation()} className="mt-4 rounded-full bg-[#0A1712] px-6 py-3"><Text className="font-semibold text-white">Réessayer</Text></Pressable></View>}
        {status === "ready" && lines.length === 0 && <View className="items-start px-2 pt-4">
          <View className="mb-2 flex-row items-center gap-x-2">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-[#0A1712]"><Image source={images.logoWhite} style={{ width: 13, height: 8 }} contentFit="contain" /></View>
            <Text allowFontScaling={false} className="text-[13px] font-semibold text-zeno-text-primary">{language === "fr" ? "Assistant ZENO" : "ZENO Assistant"}</Text>
          </View>
          <View className="max-w-[88%] rounded-[20px] rounded-tl-[6px] border border-gray-100 bg-white px-4 py-3 shadow-low">
            <Text allowFontScaling={false} className="text-[14px] font-medium leading-[22px] text-zeno-text-primary">{language === "fr" ? "Bonjour 👋 Comment puis-je t’aider aujourd’hui ?" : "Hi 👋 How can I help you today?"}</Text>
          </View>
          <View className="mt-5 w-full items-end gap-y-2">
            {suggestedMessages.map((suggestion) => <Pressable key={suggestion} disabled={sending} onPress={() => void sendMessage(suggestion)} className="max-w-[94%] self-end rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-low" style={({ pressed }) => ({ opacity: pressed || sending ? 0.6 : 1 })}>
              <Text allowFontScaling={false} className="text-[14px] font-medium text-zeno-text-primary">{suggestion}</Text>
            </Pressable>)}
          </View>
        </View>}
        {status === "ready" && lines.map((line) => (
          <View key={line.id} className={`mb-3 ${line.isCurrentUser ? "items-end" : "items-start"}`}>
            {!line.isCurrentUser && <Text className="mb-1.5 ml-1 text-[12px] font-semibold text-zeno-text-secondary">{line.isAssistant ? (language === "fr" ? "Assistant ZENO" : "ZENO Assistant") : (language === "fr" ? "Équipe ZENO" : "ZENO Support")}</Text>}
            <View className={`max-w-[82%] rounded-[20px] px-4 py-3 ${line.isCurrentUser ? "rounded-tr-[6px] bg-[#0A1712]" : "rounded-tl-[6px] border border-gray-100 bg-white shadow-low"}`}>
              <Text allowFontScaling={false} className={`text-[14px] font-medium leading-[22px] ${line.isCurrentUser ? "text-white" : "text-zeno-text-primary"}`}>{line.text}</Text>
            </View>
            <Text className="mx-1 mt-1 text-[11px] font-medium text-gray-400">{formatTime(line.createdAt)}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="border-t border-gray-100 bg-white px-4 pb-3 pt-3">
        {credentials?.status !== "human" && credentials?.status !== "waiting" && <Pressable disabled={requestingAgent || status !== "ready"} onPress={() => void requestHumanAgent()} className="mb-3 self-start rounded-full border border-gray-200 bg-[#F4FAFF] px-4 py-2.5" style={({ pressed }) => ({ opacity: pressed || requestingAgent ? 0.6 : 1 })}>
          <Text className="text-[13px] font-semibold text-zeno-text-primary">{requestingAgent ? (language === "fr" ? "Demande en cours…" : "Sending request…") : (language === "fr" ? "Parler à un agent" : "Talk to an agent")}</Text>
        </Pressable>}
        <View className="flex-row items-end gap-x-2 rounded-[24px] border border-gray-200 bg-[#F4FAFF] py-2 pl-4 pr-2">
          <TextInput value={inputText} onChangeText={setInputText} placeholder={language === "fr" ? "Pose une question…" : "Ask a question…"} placeholderTextColor="#9CA3AF" multiline className="min-h-[36px] max-h-[100px] flex-1 text-[15px] font-medium leading-[22px] text-zeno-text-primary" allowFontScaling={false} returnKeyType="send" onSubmitEditing={() => void sendMessage(inputText)} blurOnSubmit={false} editable={status === "ready" && !sending} />
          <Pressable disabled={!inputText.trim() || sending || status !== "ready"} onPress={() => void sendMessage(inputText)} className="mb-0.5 h-9 w-9 items-center justify-center rounded-full bg-[#0A1712]" style={({ pressed }) => ({ opacity: pressed || sending ? 0.6 : 1 })}>
            {sending ? <ZenoLoading variant="blue" size={22} color="#FFFFFF" /> : <SendUpIcon size={16} color="#FFFFFF" />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
