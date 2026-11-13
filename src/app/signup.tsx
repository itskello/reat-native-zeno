import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { Chevron } from "@/components/ui/Chevron";
import { CountrySheet } from "@/components/ui/CountrySheet";
import { images } from "@/constants/images";
import { SupportedCountry } from "@/data/countries";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useLanguageStore } from "@/store/language-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const language = useLanguageStore((state) => state.language);
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const selectedCountry = useOnboardingStore((state) => state.residencyCountry);
  const setResidencyCountry = useOnboardingStore(
    (state) => state.setResidencyCountry
  );

  const handleSelectCountry = (country: SupportedCountry) => {
    setResidencyCountry(country);
    setIsCountrySheetOpen(false);
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
          className="mt-10 font-bold text-[40px] leading-[46px] text-black"
          allowFontScaling={false}
        >
          {language === "fr" ? "Où habitez-vous ?" : <>Where Do You{"\n"}Live</>}
        </Text>

        <Text
          className="mt-6 font-bold text-[18px] leading-[28px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          This Will Help Us Customize Your Experience Based On Your Location
        </Text>

        <View className="mt-[76px] px-[10px]">
          <Text
            className="ml-1 font-semibold text-[15px] text-[#202020]"
            allowFontScaling={false}
          >
            Country Of Residency
          </Text>

          <Pressable
            className="mt-3 h-[54px] flex-row items-center rounded-[20px] bg-white px-5 shadow-card"
            onPress={() => setIsCountrySheetOpen(true)}
          >
            {selectedCountry ? (
              <Image
                source={selectedCountry.flag}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : null}
            <Text
              className={`flex-1 font-medium text-[17px] text-[#252525] ${
                selectedCountry ? "ml-[14px]" : ""
              }`}
              allowFontScaling={false}
            >
              {selectedCountry ? selectedCountry.name : "Select Country"}
            </Text>
            <Chevron direction="down" size={11} />
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <Pressable
          className={`mx-[10px] h-[56px] items-center justify-center rounded-full ${
            selectedCountry ? "bg-zeno-green" : "bg-[#D3D3D3]"
          }`}
          disabled={!selectedCountry}
          onPress={() => setIsDocumentsModalOpen(true)}
        >
          <Text
            className={`font-bold text-[20px] ${
              selectedCountry ? "text-zeno-dark" : "text-[#ADADAD]"
            }`}
            allowFontScaling={false}
          >
            Create Account
          </Text>
        </Pressable>

        <View className="mt-6 flex-row flex-wrap items-center justify-center">
          <Text
            className="font-medium text-[15px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Already Have An Account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/login")} hitSlop={8}>
            <Text
              className="font-bold text-[15px] text-zeno-link-blue"
              allowFontScaling={false}
            >
              Login
            </Text>
          </Pressable>
        </View>
      </View>

      <CountrySheet
        visible={isCountrySheetOpen}
        onClose={() => setIsCountrySheetOpen(false)}
        onSelect={handleSelectCountry}
      />
      {selectedCountry ? (
        <Modal
          visible={isDocumentsModalOpen}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setIsDocumentsModalOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/35">
            <Pressable className="flex-1" onPress={() => setIsDocumentsModalOpen(false)} accessibilityLabel={language === "fr" ? "Fermer" : "Close"} />
            <View className="rounded-t-[30px] bg-white px-6 pb-8 pt-5">
              <View className="items-end">
                <Pressable onPress={() => setIsDocumentsModalOpen(false)} className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F6F8]" accessibilityRole="button" accessibilityLabel={language === "fr" ? "Fermer" : "Close"}>
                  <Text className="text-[25px] leading-[28px] text-zeno-dark">×</Text>
                </Pressable>
              </View>
              <View className="mt-1 items-center">
                <Image source={selectedCountry.flag} style={{ width: 58, height: 58, borderRadius: 29 }} contentFit="cover" />
                <Text className="mt-4 text-center font-bold text-[27px] leading-[34px] text-zeno-text-primary" allowFontScaling={false}>
                  {language === "fr" ? "Pièces d’identité acceptées" : "Accepted identity documents"}
                </Text>
                <Text className="mt-2 text-center text-[16px] leading-[23px] text-zeno-text-secondary" allowFontScaling={false}>
                  {language === "fr" ? "Voici les documents disponibles pour l’inscription" : "These documents are available for sign-up"}
                </Text>
              </View>
              <View className="mt-6 overflow-hidden rounded-[20px] border border-[#C7FF4A] bg-[#F8FBEF] px-4">
                {[
                  language === "fr" ? "Passeport" : "Passport",
                  language === "fr" ? (selectedCountry.id === "benin" ? "Carte nationale d’identité (ANIP)" : "Carte nationale d’identité") : (selectedCountry.id === "benin" ? "National identity card (ANIP)" : "National identity card"),
                  language === "fr" ? "Permis de conduire" : "Driving licence",
                ].map((label, index) => (
                  <View key={label} className={`min-h-[58px] flex-row items-center ${index < 2 ? "border-b border-[#E7EED6]" : ""}`}>
                    <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-zeno-green">
                      <Text className="text-[16px] text-zeno-dark">{index === 0 ? "▤" : index === 1 ? "▣" : "▱"}</Text>
                    </View>
                    <Text className="flex-1 py-3 text-[15px] leading-[20px] text-zeno-text-primary" allowFontScaling={false}>{label}</Text>
                    <Text className="ml-2 text-[20px] font-semibold text-[#16845B]">✓</Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => {
                  setIsDocumentsModalOpen(false);
                  router.push("/signup-details");
                }}
                className="mt-6 h-[58px] items-center justify-center rounded-full bg-zeno-green"
                accessibilityRole="button"
              >
                <Text className="font-semibold text-[17px] text-zeno-dark" allowFontScaling={false}>
                  {language === "fr" ? "Continuer quand même" : "Continue anyway"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

