import { images } from "@/constants/images";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LanguageOption = {
  id: string;
  name: string;
  nativeName: string;
};

const LANGUAGES: LanguageOption[] = [
  { id: "fr", name: "French", nativeName: "Français (FCFA / Afrique West)" },
  { id: "en", name: "English", nativeName: "English (Global)" },
];

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);
  const [selectedLanguage, setSelectedLanguage] = useState("fr");

  const handleSelectLanguage = (lang: LanguageOption) => {
    setSelectedLanguage(lang.id);
    Alert.alert(
      "Langue modifiée",
      `La langue de l'application a été définie sur : ${lang.nativeName}`
    );
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <SettingsSkeleton rows={3} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Top Header */}
        <View className="flex-row items-center pt-2">
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
            className="ml-4 font-bold text-[22px] text-zeno-text-primary"
          >
            Langue / Language
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Subtitle Block */}
          <View className="mb-6">
            <Text
              allowFontScaling={false}
              className="font-bold text-[22px] text-zeno-text-primary"
            >
              Choisir la langue
            </Text>
            <Text
              allowFontScaling={false}
              className="mt-1 font-medium text-[15px] text-zeno-text-secondary"
            >
              Sélectionnez la langue d'affichage de votre application ZENO.
            </Text>
          </View>

          {/* Languages List Card */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs">
            {LANGUAGES.map((lang, index) => {
              const isSelected = selectedLanguage === lang.id;
              return (
                <Pressable
                  key={lang.id}
                  onPress={() => handleSelectLanguage(lang)}
                  className={`flex-row items-center justify-between py-3 ${
                    index > 0 ? "border-t border-gray-100 mt-2 pt-4" : ""
                  }`}
                >
                  <View>
                    <Text
                      allowFontScaling={false}
                      className="font-semibold text-[17px] text-zeno-text-primary"
                    >
                      {lang.nativeName}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      className="text-[13px] text-zeno-text-secondary mt-0.5"
                    >
                      {lang.name}
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-[#70DF00]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <View className="h-3.5 w-3.5 rounded-full bg-[#70DF00]" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}



