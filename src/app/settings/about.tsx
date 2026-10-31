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
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const handleWhatsNew = () => {
    showLocalizedAlert(
      "What's New in v1.0.0",
      "🎉 Bienvenue sur ZENO!\n\n" +
        "• Portefeuille digital avec dépôts et retraits Mobile Money\n" +
        "• Transferts peer-to-peer entre utilisateurs ZENO\n" +
        "• Création de liens de paiement\n" +
        "• Carte virtuelle ZENO Visa\n" +
        "• Paiements par QR Code\n" +
        "• Vérification d'identité (KYC)\n" +
        "• Support Bénin et Côte d'Ivoire",
      [{ text: "OK" }]
    );
  };

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
          App version {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </View>
  );
}

