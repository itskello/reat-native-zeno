import { useUser } from "@clerk/clerk-expo";
import {
  MicrophoneIcon,
  PaperclipIcon,
  SendUpIcon,
  SparkleIcon,
} from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

// ─── Inline Icons (small, chat-specific) ────────────────────────────────────

function BackArrowIcon({ size = 20, color = "#071706" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 5l-7 7 7 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OnlineDot() {
  return (
    <Svg width={8} height={8} viewBox="0 0 8 8" fill="none">
      <Circle cx="4" cy="4" r="4" fill="#22C55E" />
    </Svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageRole = "agent" | "user";

type ChatMessage = {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
};

// ─── Quick Reply Chips ────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Vérifier mon identité",
  "Recharger mon compte",
  "Affichage de la devise du compte",
  "Virements entrants",
  "Virement sortant",
  "Carte",
  "Gestion des frais",
  "Paiements – Remboursement – Contestation",
  "Compte restreint ou suspendu",
  "Demande de résiliation du compte",
];

// ─── Agent auto-replies ──────────────────────────────────────────────────────

function getAgentReply(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("identité") || msg.includes("kyc") || msg.includes("vérif"))
    return "Pour vérifier votre identité, allez dans Compte → Vérification. Vous aurez besoin d'une pièce d'identité valide et d'un selfie. Notre équipe validera votre dossier dans les 24 à 48 heures.";
  if (msg.includes("recharge") || msg.includes("ajouter") || msg.includes("dépôt"))
    return "Pour recharger votre compte, depuis Wallet Home appuyez sur « Add Money » → choisissez votre opérateur Mobile Money → entrez le montant → confirmez. Le crédit est instantané.";
  if (msg.includes("devise") || msg.includes("currency"))
    return "Votre portefeuille ZENO fonctionne en USD/EUR. Vous pouvez voir le montant équivalent en XOF dans les détails de chaque transaction.";
  if (msg.includes("virement entrant") || msg.includes("reçu"))
    return "Les virements entrants sont crédités instantanément. Si vous n'avez pas reçu un virement, vérifiez l'ID de transaction et contactez l'expéditeur.";
  if (msg.includes("virement sortant") || msg.includes("envoi"))
    return "Pour envoyer de l'argent : Wallet Home → Send Money → choisissez un utilisateur ZENO ou Mobile Money → montant → PIN → Confirmer.";
  if (msg.includes("carte") && !msg.includes("probl"))
    return "Votre carte ZENO virtuelle Visa est accessible depuis l'écran Wallet via le glisser vers le bas. Vous pouvez voir le numéro, la date d'expiration et le CVV de façon sécurisée.";
  if (msg.includes("frais") || msg.includes("tarif") || msg.includes("commission"))
    return "Les frais ZENO varient selon le type de transaction. Les dépôts Mobile Money sont gratuits. Les retraits et transferts internationaux peuvent être soumis à des frais. Consultez Aide → Frais et tarification.";
  if (msg.includes("paiement") || msg.includes("remboursement") || msg.includes("contestation"))
    return "Pour contester une transaction, accédez aux Détails de la transaction → Signaler un problème. Notre équipe traitera votre demande dans les 2 à 5 jours ouvrables.";
  if (msg.includes("restreint") || msg.includes("suspendu") || msg.includes("bloqué"))
    return "Si votre compte est restreint, c'est souvent lié à une vérification d'identité incomplète ou à une activité inhabituelle. Répondez ici avec votre ID de compte pour accélérer le traitement.";
  if (msg.includes("résiliation") || msg.includes("fermer") || msg.includes("supprimer"))
    return "Pour demander la résiliation de votre compte, veuillez envoyer une demande écrite à support@zeno.app depuis votre adresse e-mail enregistrée. Notre équipe vous guidera dans le processus.";
  if (msg.includes("problème") || msg.includes("transaction") || msg.includes("id:"))
    return "Merci de nous avoir signalé ce problème. Notre équipe de support a reçu votre signalement et vous répondra dans les 24 à 48 heures. Pour accélérer le traitement, assurez-vous d'inclure l'ID de transaction concernée.";
  return "Merci pour votre message. Un agent ZENO va examiner votre demande et vous répondra dans les plus brefs délais. Vous pouvez également nous contacter à support@zeno.app.";
}

// ─── Typing indicator dots ───────────────────────────────────────────────────

function TypingDots() {
  return (
    <View className="flex-row items-center gap-x-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <Svg key={i} width={8} height={8} viewBox="0 0 8 8" fill="none">
          <Circle cx="4" cy="4" r="3.5" fill="#9CA3AF" />
        </Svg>
      ))}
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Support Chat Screen
 *
 * AI-agent-style chat interface for ZENO support.
 * All icons are premium SVG — zero emoji in the UI chrome.
 *
 * Pre-fill: if `prefillMessage` is passed as a route param (e.g. from
 * "Signaler un problème" in transaction details), it is auto-sent as the
 * user's first message.
 */
export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const { prefillMessage } = useLocalSearchParams<{ prefillMessage?: string }>();

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "agent-welcome",
      role: "agent",
      text: "Bonjour, comment pouvons-nous t'assister aujourd'hui ?",
      timestamp: new Date(),
    },
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [quickRepliesSent, setQuickRepliesSent] = useState(false);

  useEffect(() => {
    if (prefillMessage && prefillMessage.trim().length > 0) {
      setTimeout(() => sendMessage(prefillMessage.trim()), 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setQuickRepliesSent(true);
    setIsAgentTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: "agent",
        text: getAgentReply(trimmed),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
      setIsAgentTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, delay);
  };

  const handleSend = () => sendMessage(inputText);
  const handleQuickReply = (chip: string) => sendMessage(chip);
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const canSend = inputText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F4FAFF]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={{ paddingBottom: insets.bottom }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <View
        className="bg-white border-b border-gray-100 px-4 flex-row items-center gap-x-3"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        {/* Back */}
        <Pressable
          className="h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#F4FAFF]"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Image
            source={images.back}
            style={{ width: 50, height: 50 }}
            contentFit="contain"
          />
        </Pressable>

        {/* Agent avatar (dark circle with ZENO logo) */}
        <View className="h-10 w-10 items-center justify-center rounded-full bg-[#0A1712] shadow-sm">
          <Image
            source={images.logoWhite}
            style={{ width: 22, height: 14 }}
            contentFit="contain"
          />
        </View>

        <View className="flex-1">
          <Text
            allowFontScaling={false}
            className="text-[16px] font-bold text-zeno-text-primary"
          >
            ZENO
          </Text>
          <View className="flex-row items-center gap-x-2 mt-0.5">
            <OnlineDot />
            <Text
              allowFontScaling={false}
              className="text-[12px] font-medium text-zeno-text-secondary"
            >
              AI Agent · En ligne
            </Text>
          </View>
        </View>

        {/* Sparkle badge (AI indicator) */}
        <View className="h-8 w-8 items-center justify-center rounded-full bg-[#0A1712]">
          <SparkleIcon size={16} color="#C7FF4A" />
        </View>
      </View>

      {/* ── Hint bar ─────────────────────────────────────────── */}
      <View className="items-center py-2.5 border-b border-gray-100 bg-white">
        <Text
          allowFontScaling={false}
          className="text-[13px] font-medium text-zeno-text-secondary"
        >
          En quoi pouvons-nous t'assister ?
        </Text>
      </View>

      {/* ── Messages ─────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-3 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {/* Agent label */}
            {msg.role === "agent" && (
              <View className="flex-row items-center gap-x-2 mb-1.5 ml-1">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-[#0A1712]">
                  <Image
                    source={images.logoWhite}
                    style={{ width: 13, height: 8 }}
                    contentFit="contain"
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  className="text-[12px] font-semibold text-zeno-text-secondary"
                >
                  ZENO · AI Agent
                </Text>
              </View>
            )}

            {/* Bubble */}
            <View
              className={`max-w-[80%] rounded-[20px] px-4 py-3 ${
                msg.role === "user"
                  ? "bg-[#0A1712] rounded-tr-[6px]"
                  : "bg-white rounded-tl-[6px] border border-gray-100/80 shadow-low"
              }`}
            >
              <Text
                allowFontScaling={false}
                className={`text-[14px] font-medium leading-[22px] ${
                  msg.role === "user"
                    ? "text-white"
                    : "text-zeno-text-primary"
                }`}
              >
                {msg.text}
              </Text>
            </View>

            {/* Timestamp */}
            <Text
              allowFontScaling={false}
              className="mt-1 mx-1 text-[11px] font-medium text-gray-400"
            >
              {formatTime(msg.timestamp)}
            </Text>
          </View>
        ))}

        {/* Agent typing indicator */}
        {isAgentTyping && (
          <View className="items-start mb-3">
            <View className="flex-row items-center gap-x-2 mb-1.5 ml-1">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-[#0A1712]">
                <Image
                  source={images.logoWhite}
                  style={{ width: 13, height: 8 }}
                  contentFit="contain"
                />
              </View>
              <Text
                allowFontScaling={false}
                className="text-[12px] font-semibold text-zeno-text-secondary"
              >
                ZENO · AI Agent
              </Text>
            </View>
            <View className="bg-white rounded-[20px] rounded-tl-[6px] px-5 py-3.5 border border-gray-100 shadow-low">
              <TypingDots />
            </View>
          </View>
        )}

        {/* Quick Reply Chips — shown only before first user message */}
        {!quickRepliesSent && (
          <View className="mt-2 mb-1 flex-row flex-wrap gap-2 justify-end">
            {QUICK_REPLIES.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => handleQuickReply(chip)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 shadow-low"
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
              >
                <Text
                  allowFontScaling={false}
                  className="text-[13px] font-semibold text-zeno-text-primary"
                >
                  {chip}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Input Bar ────────────────────────────────────────── */}
      <View className="border-t border-gray-100 bg-white px-4 pt-3 pb-3">
        <View className="flex-row items-end rounded-[24px] bg-[#F4FAFF] border border-gray-200 pl-4 pr-2 py-2 gap-x-2">
          {/* Attachment */}
          <Pressable
            hitSlop={8}
            className="mb-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <PaperclipIcon size={20} color="#9CA3AF" />
          </Pressable>

          {/* Text input */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Posez une question..."
            placeholderTextColor="#9CA3AF"
            multiline
            className="flex-1 text-[15px] font-medium text-zeno-text-primary leading-[22px] max-h-[100px] min-h-[36px]"
            allowFontScaling={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          {/* Microphone (when no text) or Send (when text) */}
          {canSend ? (
            <Pressable
              onPress={handleSend}
              className="h-9 w-9 items-center justify-center rounded-full bg-[#0A1712] mb-0.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <SendUpIcon size={16} color="#FFFFFF" />
            </Pressable>
          ) : (
            <Pressable
              hitSlop={8}
              className="h-9 w-9 items-center justify-center mb-0.5"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <MicrophoneIcon size={20} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}


