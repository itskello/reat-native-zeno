import { LocalizedText as Text, LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { SendUpIcon } from "@/components/ui/ProfileIcons";
import { getAuthenticated, postAuthenticated } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { StreamChat, type Channel, type Event } from "stream-chat";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AgentConversation = {
  id: string;
  customerId: string;
  customerName: string;
  status: string;
  lastMessage: string;
  updatedAt: string | null;
};

type AgentCredentials = { apiKey: string; token: string; userId: string; userName: string; channelId: string };
type ChatLine = { id: string; text: string; sender: string; time: string };

export default function SupportAgentScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const clientRef = useRef<StreamChat | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [selected, setSelected] = useState<AgentConversation | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const loadInbox = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    try {
      const token = await getTokenRef.current();
      if (!token) throw new Error("Session expirée. Reconnecte-toi.");
      const response = await getAuthenticated<{ conversations: AgentConversation[] }>("/api/support/agent/inbox", token);
      if (!response.ok) throw new Error(response.error);
      setConversations(response.data.conversations);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les conversations.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    void loadInbox();
    const interval = setInterval(() => void loadInbox(), 15_000);
    return () => clearInterval(interval);
  }, [loadInbox]);

  useEffect(() => () => {
    void clientRef.current?.disconnectUser().catch(() => {});
    clientRef.current = null;
    channelRef.current = null;
  }, []);

  const openConversation = useCallback(async (conversation: AgentConversation) => {
    try {
      setLoading(true);
      const token = await getTokenRef.current();
      if (!token) throw new Error("Session expirée. Reconnecte-toi.");
      const response = await postAuthenticated<AgentCredentials>("/api/support/agent/inbox", token, { channelId: conversation.id });
      if (!response.ok) throw new Error(response.error);
      const credentials = response.data;
      const client = StreamChat.getInstance(credentials.apiKey);
      clientRef.current = client;
      await client.connectUser({ id: credentials.userId, name: credentials.userName }, credentials.token);
      const channel = client.channel("messaging", credentials.channelId);
      await channel.watch();
      channelRef.current = channel;
      setLines(channel.state.messages.flatMap((message) => {
        if (!message.id || typeof message.text !== "string") return [];
        return [{
          id: message.id,
          text: message.text,
          sender: message.user?.name ?? "ZENO User",
          time: message.created_at ? new Date(message.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "",
        }];
      }));
      channel.on("message.new", (event: Event) => {
        const message = event.message;
        if (!message?.id || !message.text) return;
        const line: ChatLine = {
          id: message.id,
          text: message.text,
          sender: message.user?.name ?? "ZENO User",
          time: message.created_at ? new Date(message.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "",
        };
        setLines((current) => current.some((existing) => existing.id === line.id) ? current : [...current, line]);
      });
      setSelected(conversation);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’ouvrir cette conversation.");
    } finally {
      setLoading(false);
    }
  }, []);

  const sendReply = useCallback(async () => {
    const channel = channelRef.current;
    const text = input.trim();
    if (!channel || !text || sending) return;
    setSending(true);
    setInput("");
    try {
      await channel.sendMessage({ text });
    } catch {
      setInput(text);
      setError("Message non envoyé. Vérifie la connexion puis réessaie.");
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  const title = selected?.customerName ?? "Boîte d’assistance";

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center gap-x-3 border-b border-gray-100 bg-white px-4 py-3">
        <Pressable onPress={() => selected ? (void clientRef.current?.disconnectUser().catch(() => {}), setSelected(null), setLines([]), void loadInbox()) : router.back()} className="h-11 w-11 items-center justify-center rounded-[14px] bg-[#F4FAFF]">
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5m7-7-7 7 7 7" stroke="#071706" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
        </Pressable>
        <View className="flex-1"><Text className="text-[18px] font-bold text-zeno-text-primary">{title}</Text><Text className="text-[12px] text-zeno-text-secondary">{selected ? "Conversation reprise par un agent" : "Conversations en attente"}</Text></View>
        {!selected && <Pressable onPress={() => void loadInbox()} className="h-10 items-center justify-center rounded-full bg-[#F4FAFF] px-3"><Text className="text-[13px] font-semibold text-zeno-text-primary">Actualiser</Text></Pressable>}
      </View>

      {error ? <View className="mx-4 mt-4 rounded-2xl bg-white p-4"><Text className="text-[14px] text-red-600">{error}</Text></View> : null}

      {!selected ? <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 12 }}>
        {loading && conversations.length === 0 ? <View className="items-center py-12"><ActivityIndicator color="#0A1712" /></View> : null}
        {!loading && conversations.length === 0 && !error ? <Text className="py-12 text-center text-[14px] text-zeno-text-secondary">Aucune conversation en attente.</Text> : null}
        {conversations.map((conversation) => <Pressable key={conversation.id} onPress={() => void openConversation(conversation)} className="mb-3 rounded-[20px] bg-white p-4" style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <View className="flex-row items-center"><Text className="flex-1 text-[16px] font-bold text-zeno-text-primary">{conversation.customerName}</Text><Text className="rounded-full bg-[#C7FF4A] px-3 py-1 text-[11px] font-semibold text-[#0A1712]">{conversation.status === "human" ? "En cours" : "Nouveau"}</Text></View>
          <Text numberOfLines={2} className="mt-2 text-[14px] text-zeno-text-secondary">{conversation.lastMessage || "Aucun message"}</Text>
        </Pressable>)}
      </ScrollView> : <>
        <ScrollView ref={scrollRef} className="flex-1 px-4" contentContainerStyle={{ paddingVertical: 16 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {lines.map((line) => <View key={line.id} className="mb-3"><Text className="mb-1 ml-1 text-[12px] font-semibold text-zeno-text-secondary">{line.sender} · {line.time}</Text><View className="self-start max-w-[86%] rounded-[20px] rounded-tl-[6px] border border-gray-100 bg-white px-4 py-3"><Text className="text-[14px] leading-[22px] text-zeno-text-primary">{line.text}</Text></View></View>)}
        </ScrollView>
        <View className="flex-row items-end gap-x-2 border-t border-gray-100 bg-white px-4 pb-3 pt-3">
          <TextInput value={input} onChangeText={setInput} placeholder="Répondre…" multiline className="min-h-[40px] max-h-[100px] flex-1 rounded-[20px] bg-[#F4FAFF] px-4 py-2 text-[15px] text-zeno-text-primary" returnKeyType="send" onSubmitEditing={() => void sendReply()} blurOnSubmit={false} />
          <Pressable disabled={!input.trim() || sending} onPress={() => void sendReply()} className="mb-0.5 h-10 w-10 items-center justify-center rounded-full bg-[#0A1712]">{sending ? <ActivityIndicator color="#fff" size="small" /> : <SendUpIcon size={17} color="#FFFFFF" />}</Pressable>
        </View>
      </>}
    </View>
  );
}
