import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { BookOpenIcon, ChevronRightIcon, CloseIcon, MessageChatIcon, SearchIcon } from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { HELP_ARTICLES, HELP_COLLECTIONS, type HelpArticle, type HelpCollection } from "@/data/help-articles";
import { useLanguageStore } from "@/store/language-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput as NativeTextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HelpView = "home" | "search" | "collection" | "article";

export function SupportHelpScreen({ initialView = "home" }: { initialView?: "home" | "search" }) {
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const isFrench = language === "fr";
  const [view, setView] = useState<HelpView>(initialView);
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState<HelpCollection | null>(null);
  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [articleOrigin, setArticleOrigin] = useState<"search" | "collection">("collection");
  const [rating, setRating] = useState<number | null>(null);

  const searchResults = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(isFrench ? "fr-FR" : "en-US");
    const normalizedQuery = normalize(query.trim());
    if (!normalizedQuery) return [];
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    return HELP_ARTICLES.filter((item) => {
      const helpCollection = HELP_COLLECTIONS.find((entry) => entry.id === item.collectionId);
      const articleText = isFrench
        ? `${item.question} ${item.answer} ${helpCollection?.title ?? ""} ${helpCollection?.description ?? ""}`
        : `${item.questionEn} ${item.answerEn} ${helpCollection?.titleEn ?? ""} ${helpCollection?.descriptionEn ?? ""}`;
      const normalizedArticle = normalize(articleText);
      return terms.some((term) => normalizedArticle.includes(term));
    });
  }, [isFrench, query]);

  const openCollection = (item: HelpCollection) => {
    setCollection(item);
    setView("collection");
  };

  const openArticle = (item: HelpArticle, origin: "search" | "collection") => {
    setArticle(item);
    setArticleOrigin(origin);
    setRating(null);
    setView("article");
  };

  const goHome = () => {
    setView("home");
    setQuery("");
    setArticle(null);
    setCollection(null);
  };

  const back = () => {
    if (view === "article") {
      setArticle(null);
      setView(articleOrigin);
      return;
    }
    if (view === "search" && initialView === "search") {
      router.back();
      return;
    }
    if (view === "collection" || view === "search") {
      goHome();
      return;
    }
    router.replace("/settings/support");
  };

  const pageTitle = view === "home"
    ? (isFrench ? "Aide" : "Help")
    : view === "collection" && collection
      ? (isFrench ? collection.title : collection.titleEn)
      : "";

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: view === "article" ? 0 : insets.bottom }}>
      <View className="flex-row items-center gap-x-4 border-b border-gray-100 bg-white px-5 py-3">
        <Pressable className="h-10 w-10 items-center justify-center rounded-[14px] bg-[#F4FAFF]" onPress={back} hitSlop={10} accessibilityLabel={isFrench ? "Retour" : "Back"}>
          {view === "article" ? <CloseIcon size={22} color="#0A1712" /> : <Image source={images.back} style={{ width: 42, height: 42 }} contentFit="contain" />}
        </Pressable>
        {view === "search" ? (
          <NativeTextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={isFrench ? "Rechercher une aide" : "Search for help"}
            placeholderTextColor="#8A929D"
            returnKeyType="search"
            className="h-10 flex-1 text-[16px] text-[#071706]"
            accessibilityLabel={isFrench ? "Rechercher dans le centre d’aide" : "Search the help center"}
          />
        ) : (
          <Text allowFontScaling={false} className={`flex-1 ${view === "article" ? "text-[16px]" : "text-[20px]"} font-bold text-zeno-text-primary`} numberOfLines={1}>{view === "article" ? (isFrench ? "Article d’aide" : "Help article") : pageTitle}</Text>
        )}
        {view === "home" ? <Pressable onPress={() => { setCollection(null); setQuery(""); setView("search"); }} className="h-10 w-10 items-center justify-center" hitSlop={10} accessibilityLabel={isFrench ? "Rechercher" : "Search"}><SearchIcon size={22} color="#0A1712" /></Pressable> : null}
        {view === "search" && query.length > 0 ? <Pressable onPress={() => setQuery("")} className="h-10 w-8 items-center justify-center" hitSlop={8}><CloseIcon size={18} color="#77808C" /></Pressable> : null}
      </View>

      {view === "article" && article ? (
        <>
          <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30 }}>
            <Text allowFontScaling={false} className="text-[27px] font-bold leading-[34px] text-[#071706]">{isFrench ? article.question : article.questionEn}</Text>
            <Text allowFontScaling={false} className="mt-5 text-[14px] font-medium text-[#7A8491]">{isFrench ? "Centre d’aide ZENO" : "ZENO Help Center"}</Text>
            <Text allowFontScaling={false} className="mt-7 text-[16px] leading-[27px] text-[#18231C]">{isFrench ? article.answer : article.answerEn}</Text>
            <Pressable onPress={() => router.push("/settings/support-chat")} className="mt-8 flex-row items-center justify-center self-start rounded-full border border-[#DDE6E0] bg-[#F4FAFF] px-5 py-3">
              <Text allowFontScaling={false} className="text-[14px] font-semibold text-[#0A1712]">{isFrench ? "Contacter l’assistance" : "Contact support"}</Text>
              <View className="ml-2"><MessageChatIcon size={17} color="#0F7153" /></View>
            </Pressable>
          </ScrollView>
          <View className="items-center border-t border-gray-100 bg-white px-4 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <Text allowFontScaling={false} className="text-center text-[15px] font-medium text-[#39443E]">{isFrench ? "Cette réponse t’a-t-elle aidé ?" : "Did this answer your question?"}</Text>
            <View className="mt-3 flex-row items-center gap-x-5">
              {["🙁", "😐", "😃"].map((face, index) => <Pressable key={face} onPress={() => setRating(index)} className={`h-12 w-12 items-center justify-center rounded-full ${rating === index ? "bg-[#C7FF4A]" : "bg-[#F1F7E5]"}`} accessibilityLabel={isFrench ? ["Pas vraiment", "Moyennement", "Oui"][index] : ["Not really", "Somewhat", "Yes"][index]}><Text className="text-[25px]">{face}</Text></Pressable>)}
            </View>
            {rating !== null ? <Text allowFontScaling={false} className="mt-2 text-[12px] text-[#6B7280]">{isFrench ? "Merci pour ton avis." : "Thanks for your feedback."}</Text> : null}
          </View>
        </>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 30 }}>
          {view === "home" ? <>
            <View className="border-b border-gray-100 bg-white px-5 py-4">
              <Text allowFontScaling={false} className="text-[14px] font-semibold text-[#38433D]">{isFrench ? `${HELP_COLLECTIONS.length} rubriques` : `${HELP_COLLECTIONS.length} collections`}</Text>
            </View>
            <View className="bg-white px-5">
              {HELP_COLLECTIONS.map((item, index) => (
                <Pressable key={item.id} onPress={() => openCollection(item)} className={`flex-row items-center py-5 ${index > 0 ? "border-t border-gray-100" : ""}`} style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}>
                  <View className="flex-1 pr-3">
                    <Text allowFontScaling={false} className="text-[15px] font-bold text-[#071706]">{isFrench ? item.title : item.titleEn}</Text>
                    <Text allowFontScaling={false} className="mt-1 text-[14px] leading-[20px] text-[#5F6B66]">{isFrench ? item.description : item.descriptionEn}</Text>
                    <Text allowFontScaling={false} className="mt-1.5 text-[13px] text-[#7A8491]">{item.articleIds.length} {isFrench ? (item.articleIds.length === 1 ? "article" : "articles") : (item.articleIds.length === 1 ? "article" : "articles")}</Text>
                  </View>
                  <ChevronRightIcon size={18} color="#0F7153" />
                </Pressable>
              ))}
            </View>
          </> : view === "collection" && collection ? (
            <>
              <View className="bg-white px-5 pb-5 pt-6">
                <Text allowFontScaling={false} className="mt-1.5 text-[14px] leading-[20px] text-[#65716B]">{isFrench ? collection.description : collection.descriptionEn}</Text>
                <Text allowFontScaling={false} className="mt-4 text-[13px] text-[#7A8491]">{collection.articleIds.length} {isFrench ? "articles" : "articles"}</Text>
              </View>
              <View className="mt-2 bg-white px-5">
                {HELP_ARTICLES.filter((item) => collection.articleIds.includes(item.id)).map((item, index) => (
                  <Pressable key={item.id} onPress={() => openArticle(item, "collection")} className={`flex-row items-center py-4 ${index > 0 ? "border-t border-gray-100" : ""}`}>
                    <Text allowFontScaling={false} className="flex-1 pr-3 text-[15px] leading-[22px] text-[#18231C]">{isFrench ? item.question : item.questionEn}</Text>
                    <ChevronRightIcon size={17} color="#0F7153" />
                  </Pressable>
                ))}
              </View>
            </>
          ) : view === "search" ? (
            query.trim() ? (
              searchResults.length > 0 ? (
                <View className="mt-2 bg-white px-5">
                  {searchResults.map((item, index) => (
                    <Pressable key={item.id} onPress={() => openArticle(item, "search")} className={`flex-row items-center py-4 ${index > 0 ? "border-t border-gray-100" : ""}`}>
                      <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]"><BookOpenIcon size={17} color="#0F7153" /></View>
                      <Text allowFontScaling={false} className="flex-1 pr-2 text-[15px] leading-[21px] text-[#18231C]">{isFrench ? item.question : item.questionEn}</Text>
                      <ChevronRightIcon size={17} color="#0F7153" />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View className="mt-16 items-center px-8">
                  <Text allowFontScaling={false} className="text-[16px] font-semibold text-[#071706]">{isFrench ? "Aucun article trouvé" : "No articles found"}</Text>
                  <Text allowFontScaling={false} className="mt-2 text-center text-[14px] leading-[21px] text-[#65716B]">{isFrench ? "Essaie un autre mot-clé." : "Try another keyword."}</Text>
                </View>
              )
            ) : (
              <View className="mt-16 items-center px-8">
                <SearchIcon size={28} color="#0F7153" />
                <Text allowFontScaling={false} className="mt-4 text-center text-[15px] text-[#65716B]">{isFrench ? "Recherche un mot-clé ou une question." : "Search for a keyword or question."}</Text>
              </View>
            )
          ) : null}
          {view !== "home" ? <Pressable onPress={() => router.push("/settings/support-chat")} className="mx-5 mt-6 flex-row items-center justify-between rounded-[24px] bg-[#0A1712] px-5 py-4">
            <View className="flex-1 pr-3"><Text allowFontScaling={false} className="text-[15px] font-bold text-white">{isFrench ? "Besoin d’aide ?" : "Need more help?"}</Text><Text allowFontScaling={false} className="mt-0.5 text-[13px] text-gray-300">{isFrench ? "Écris à l’assistance ZENO" : "Message ZENO Support"}</Text></View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-[#C7FF4A]"><MessageChatIcon size={18} color="#0A1712" /></View>
          </Pressable> : null}
        </ScrollView>
      )}
    </View>
  );
}

export default SupportHelpScreen;
