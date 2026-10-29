import {
  BookOpenIcon,
  ChevronRightIcon,
  CloseIcon,
  MessageChatIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HelpCollection = {
  id: string;
  title: string;
  description: string;
  articleCount: number;
};

type FAQItem = {
  question: string;
  answer: string;
};

const HELP_COLLECTIONS: HelpCollection[] = [
  {
    id: "open-account",
    title: "Ouvrir un compte ZENO",
    description: "Étapes d'ouverture, documents requis, éligibilité du compte",
    articleCount: 6,
  },
  {
    id: "identity",
    title: "Vérification d'identité",
    description:
      "Processus de vérification, documents d'identité, délais, validation du compte.",
    articleCount: 5,
  },
  {
    id: "account-funding",
    title: "Fonctionnalités – Alimentation du compte",
    description: "Alimentation du compte, solde du compte, Mobile Money",
    articleCount: 5,
  },
  {
    id: "card",
    title: "Carte",
    description: "Commande, utilisation, devise, plafonds de la carte",
    articleCount: 9,
  },
  {
    id: "limits",
    title: "Usage du compte – Limites et Restrictions",
    description: "Limites, usages autorisés/interdits",
    articleCount: 10,
  },
  {
    id: "transfers",
    title: "Virements",
    description:
      "Virements SEPA et internationaux, délais de traitement, réception et envoi d'argent",
    articleCount: 4,
  },
  {
    id: "payments",
    title: "Paiements",
    description: "Paiements par lien, QR code, demande d'argent",
    articleCount: 7,
  },
  {
    id: "security",
    title: "Sécurité",
    description: "PIN, biométrie, authentification, protection du compte",
    articleCount: 8,
  },
  {
    id: "fees",
    title: "Frais et tarification",
    description: "Frais de transaction, frais de retrait, abonnements",
    articleCount: 6,
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Comment ajouter de l'argent à mon portefeuille ?",
    answer:
      "Allez sur Wallet Home → Add Money → Sélectionnez votre opérateur Mobile Money → Entrez le montant et suivez les instructions.",
  },
  {
    question: "Comment retirer de l'argent ?",
    answer:
      "Depuis Wallet Home → Withdraw Money → Choisissez votre opérateur → Entrez le numéro de téléphone et le montant → Confirmez avec votre PIN.",
  },
  {
    question: "Ma carte ZENO est-elle sécurisée ?",
    answer:
      "Oui, votre carte ZENO utilise les normes de sécurité Visa. Chaque transaction nécessite une vérification. Vous pouvez geler votre carte à tout moment.",
  },
  {
    question: "Comment changer mon code PIN ?",
    answer:
      "Allez dans Profile → Security → PIN Security. Entrez votre PIN actuel, puis définissez un nouveau PIN à 6 chiffres.",
  },
  {
    question: "Que faire si j'ai oublié mon mot de passe ?",
    answer:
      "Sur l'écran de connexion, appuyez sur 'Mot de passe oublié'. Entrez votre email/téléphone et suivez les instructions pour réinitialiser votre mot de passe.",
  },
  {
    question: "Comment effectuer un virement ?",
    answer:
      "Depuis Wallet Home → Send Money → Choisissez ZENO User ou Mobile Money → Entrez le montant → Confirmez avec votre PIN.",
  },
];

/**
 * Support Help Screen
 *
 * Displays help article collections (matching screenshot "Aide") and
 * an expandable FAQ section. All icons are premium SVG — no emoji.
 */
export default function SupportHelpScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredCollections = HELP_COLLECTIONS.filter(
    (c) =>
      searchQuery.trim() === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaq = FAQ_ITEMS.filter(
    (f) =>
      searchQuery.trim() === "" ||
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center gap-x-4 pt-3 pb-2">
          <Pressable
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Image
              source={images.back}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
            />
          </Pressable>
          <Text
            allowFontScaling={false}
            className="text-[22px] font-bold text-zeno-text-primary"
          >
            Aide
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mt-4 mb-2 flex-row items-center rounded-[18px] bg-white px-4 shadow-low border border-gray-100/60 h-12 gap-x-3">
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher une aide..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-[15px] font-medium text-zeno-text-primary"
            allowFontScaling={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <CloseIcon size={16} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
        >
          {/* Collections count */}
          <Text
            allowFontScaling={false}
            className="mt-4 mb-1 text-[14px] font-semibold text-zeno-text-secondary"
          >
            {filteredCollections.length} collection
            {filteredCollections.length !== 1 ? "s" : ""}
          </Text>

          {/* Collections list */}
          <View className="overflow-hidden rounded-[24px] bg-white shadow-low border border-gray-100/50">
            {filteredCollections.map((collection, i) => (
              <Pressable
                key={collection.id}
                className={`px-5 py-4 flex-row items-center justify-between ${
                  i > 0 ? "border-t border-gray-100" : ""
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
              >
                {/* Book icon */}
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#E8F5EE] mr-3">
                  <BookOpenIcon size={18} color="#0F7153" />
                </View>

                <View className="flex-1 pr-3">
                  <Text
                    allowFontScaling={false}
                    className="text-[15px] font-bold text-zeno-text-primary"
                  >
                    {collection.title}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="mt-0.5 text-[13px] font-medium text-zeno-text-secondary leading-[18px]"
                  >
                    {collection.description}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="mt-1 text-[12px] font-medium text-[#0F7153]"
                  >
                    {collection.articleCount} article
                    {collection.articleCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <ChevronRightIcon size={18} color="#9CA3AF" />
              </Pressable>
            ))}
            {filteredCollections.length === 0 && (
              <View className="py-8 items-center">
                <Text
                  allowFontScaling={false}
                  className="text-[15px] font-medium text-zeno-text-secondary"
                >
                  Aucune collection trouvée
                </Text>
              </View>
            )}
          </View>

          {/* FAQ Section */}
          {filteredFaq.length > 0 && (
            <>
              <Text
                allowFontScaling={false}
                className="mt-6 mb-3 text-[18px] font-semibold text-zeno-text-primary"
              >
                Questions fréquentes
              </Text>

              <View className="overflow-hidden rounded-[24px] bg-white p-4 shadow-low border border-gray-100/50 gap-y-2">
                {filteredFaq.map((item, index) => {
                  const isExpanded = expandedFaq === index;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => setExpandedFaq(isExpanded ? null : index)}
                      className={`py-3 ${index > 0 ? "border-t border-gray-100" : ""}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text
                          allowFontScaling={false}
                          className="font-semibold text-[15px] text-zeno-text-primary flex-1 pr-3 leading-[22px]"
                        >
                          {item.question}
                        </Text>
                        {/* Plus / Minus toggle */}
                        <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                          {isExpanded ? (
                            <MinusIcon size={14} color="#6B7280" />
                          ) : (
                            <PlusIcon size={14} color="#6B7280" />
                          )}
                        </View>
                      </View>
                      {isExpanded && (
                        <Text
                          allowFontScaling={false}
                          className="mt-2 font-medium text-[14px] leading-[22px] text-zeno-text-secondary"
                        >
                          {item.answer}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Still need help? CTA */}
          <Pressable
            onPress={() => router.push("/settings/support-chat")}
            className="mt-6 rounded-[24px] bg-[#0A1712] px-5 py-4 flex-row items-center justify-between shadow-md"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <View className="flex-1 pr-3">
              <Text
                allowFontScaling={false}
                className="text-[15px] font-bold text-white"
              >
                Toujours besoin d'aide ?
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-0.5 text-[13px] font-medium text-gray-300"
              >
                Discutez avec notre équipe de support
              </Text>
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#C7FF4A]">
              <MessageChatIcon size={18} color="#0A1712" />
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

