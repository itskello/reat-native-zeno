import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { CameraIcon, ChevronRightIcon, GlobeWebIcon, XSocialIcon } from "@/components/ui/ProfileIcons";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import Constants from "expo-constants";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguageStore } from "@/store/language-store";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);
  const language = useLanguageStore((state) => state.language);
  const [isWhatsNewOpen, setIsWhatsNewOpen] = useState(false);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleWhatsNew = () => {
    setIsWhatsNewOpen(true);
  };

  const whatsNewItems = language === "fr"
    ? [
        ["Portefeuille", "Consultez votre solde et vos opérations au même endroit."],
        ["Transferts", "Envoyez de l’argent vers un compte ZENO ou Mobile Money."],
        ["Paiements", "Créez un lien de paiement ou recevez de l’argent par QR code."],
        ["Carte ZENO", "Gérez votre carte virtuelle directement depuis l’application."],
      ]
    : [
        ["Wallet", "See your balance and activity in one place."],
        ["Transfers", "Send money to a ZENO account or Mobile Money."],
        ["Payments", "Create a payment link or receive money by QR code."],
        ["ZENO Card", "Manage your virtual card right from the app."],
      ];

  const handleRateUs = () => {
    showLocalizedAlert(
      "Rate ZENO",
      "Aimez-vous utiliser ZENO ? Donnez-nous votre avis sur l'App Store!",
      [
        { text: "Plus tard", style: "cancel" },
        {
          text: "Noter ⭐",
          onPress: () => {
            // In production: use expo-store-review
            showLocalizedAlert("Merci!", "Merci pour votre soutien! 🙏");
          },
        },
      ]
    );
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://zeno.app").catch(() =>
      showLocalizedAlert("Erreur", "Impossible d'ouvrir le site web.")
    );
  };

  const handleOpenTwitter = () => {
    Linking.openURL("https://twitter.com/zenoapp").catch(() =>
      showLocalizedAlert("Erreur", "Impossible d'ouvrir le lien.")
    );
  };

  const handleOpenInstagram = () => {
    Linking.openURL("https://instagram.com/zenoapp").catch(() =>
      showLocalizedAlert("Erreur", "Impossible d'ouvrir le lien.")
    );
  };

  const openLegalDocument = (document: "terms" | "privacy" | "fees") => {
    router.push(`/settings/legal-document?document=${document}` as never);
  };

  const handleTermsOfUse = () => openLegalDocument("terms");
  const handlePrivacyPolicy = () => openLegalDocument("privacy");
  const handleFeesAndLimits = () => openLegalDocument("fees");

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <SettingsSkeleton rows={5} />
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
            About
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6 flex-1"
        >
          {/* App logo */}
          <View className="items-center py-3">
            <Image source={images.logoDarkGreen} style={{ width: 156, height: 66 }} contentFit="contain" />
          </View>

          {/* Options Card */}
          <View className="mt-6 rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* What's New → shows changelog */}
            <Pressable
              onPress={handleWhatsNew}
              className="flex-row items-center justify-between py-2"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                What's New
              </Text>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Rate Us → opens rating dialog */}
            <Pressable
              onPress={handleRateUs}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                Rate Us
              </Text>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Terms of use → opens the ZENO terms hosted in Notion */}
            <Pressable
              onPress={handleTermsOfUse}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                Terms of Use
              </Text>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={handlePrivacyPolicy}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                Privacy Policy
              </Text>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={handleFeesAndLimits}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                Fees and Limits
              </Text>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Follow Us → social links */}
            <View className="py-2 border-t border-gray-100 pt-4">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary mb-3"
              >
                Follow Us
              </Text>
              <View className="flex-row items-center gap-x-4">
                <Pressable
                  onPress={handleOpenWebsite}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"
                >
                  <GlobeWebIcon size={20} color="#071706" />
                </Pressable>
                <Pressable
                  onPress={handleOpenTwitter}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"
                >
                  <XSocialIcon size={18} color="#071706" />
                </Pressable>
                <Pressable
                  onPress={handleOpenInstagram}
                  className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100"
                >
                  <CameraIcon size={20} color="#071706" />
                </Pressable>
              </View>
            </View>
          </View>

        </ScrollView>
        <Text allowFontScaling={false} className="pb-3 text-center text-[12px] font-medium text-zeno-text-secondary">
          App version {appVersion}
        </Text>
      </View>
      <Modal
        visible={isWhatsNewOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsWhatsNewOpen(false)}
      >
        <View className="flex-1 justify-end bg-[#071706]/55">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={language === "fr" ? "Fermer" : "Close"}
            className="flex-1"
            onPress={() => setIsWhatsNewOpen(false)}
          />
          <View className="max-h-[86%] rounded-t-[32px] bg-[#F4FAFF] px-5 pb-8 pt-3">
            <View className="mb-5 h-1.5 w-10 self-center rounded-full bg-[#D6DEE7]" />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="overflow-hidden rounded-[28px] bg-[#C7FF4A] p-5">
                <View className="mb-5 flex-row items-center justify-between">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#0A1712]">
                    <Image source={images.logoDarkGreen} style={{ width: 31, height: 31, tintColor: "#C7FF4A" }} contentFit="contain" />
                  </View>
                  <View className="rounded-full bg-[#0A1712]/10 px-3 py-1.5">
                    <Text allowFontScaling={false} className="text-[12px] font-bold text-[#0A1712]">ZENO · {appVersion}</Text>
                  </View>
                </View>
                <Text allowFontScaling={false} className="text-[28px] font-bold leading-[34px] text-[#0A1712]">
                  {language === "fr" ? "Quoi de neuf ?" : "What’s new?"}
                </Text>
                <Text allowFontScaling={false} className="mt-2 text-[15px] leading-[22px] text-[#0A1712]/75">
                  {language === "fr" ? "Découvrez ce que vous pouvez faire avec ZENO." : "Discover what you can do with ZENO."}
                </Text>
              </View>

              <View className="mt-5 rounded-[26px] bg-white px-4 py-1 shadow-sm">
                {whatsNewItems.map(([title, description], index) => (
                  <View key={title} className={`flex-row items-start py-4 ${index < whatsNewItems.length - 1 ? "border-b border-[#EEF1F4]" : ""}`}>
                    <View className="mr-3 mt-0.5 h-9 w-9 items-center justify-center rounded-full bg-[#EAF6FF]">
                      <Text allowFontScaling={false} className="text-[14px] font-bold text-[#0057FF]">{String(index + 1).padStart(2, "0")}</Text>
                    </View>
                    <View className="flex-1">
                      <Text allowFontScaling={false} className="text-[16px] font-bold text-[#071706]">{title}</Text>
                      <Text allowFontScaling={false} className="mt-1 text-[14px] leading-[20px] text-[#6B7280]">{description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setIsWhatsNewOpen(false)}
                className="mt-5 h-[56px] items-center justify-center rounded-full bg-[#0A1712] active:opacity-80"
              >
                <Text allowFontScaling={false} className="text-[16px] font-bold text-white">
                  {language === "fr" ? "Continuer" : "Continue"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

