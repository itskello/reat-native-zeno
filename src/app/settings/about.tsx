import { CameraIcon, ChevronRightIcon, GlobeWebIcon, XSocialIcon } from "@/components/ui/ProfileIcons";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const handleWhatsNew = () => {
    Alert.alert(
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
    Alert.alert(
      "Rate ZENO",
      "Aimez-vous utiliser ZENO ? Donnez-nous votre avis sur l'App Store!",
      [
        { text: "Plus tard", style: "cancel" },
        {
          text: "Noter ⭐",
          onPress: () => {
            // In production: use expo-store-review
            Alert.alert("Merci!", "Merci pour votre soutien! 🙏");
          },
        },
      ]
    );
  };

  const handleOpenWebsite = () => {
    Linking.openURL("https://zeno.app").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le site web.")
    );
  };

  const handleOpenTwitter = () => {
    Linking.openURL("https://twitter.com/zenoapp").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le lien.")
    );
  };

  const handleOpenInstagram = () => {
    Linking.openURL("https://instagram.com/zenoapp").catch(() =>
      Alert.alert("Erreur", "Impossible d'ouvrir le lien.")
    );
  };

  const handleLegal = () => {
    Alert.alert(
      "Legal",
      "📋 Conditions Générales d'Utilisation\n\n" +
        "En utilisant ZENO, vous acceptez nos conditions générales d'utilisation, " +
        "notre politique de confidentialité, et nos conditions de service financier.\n\n" +
        "ZENO est un service de paiement électronique opérant sous les réglementations " +
        "de la BCEAO et conforme aux normes UEMOA.\n\n" +
        "© 2025 ZENO Technologies. Tous droits réservés.\n\n" +
        "Contact juridique: legal@zeno.app",
      [{ text: "Fermer" }]
    );
  };

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
          className="mt-6"
        >
          {/* App Branding & Description */}
          <View className="items-center py-4">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-zeno-dark shadow-md mb-3">
              <Text
                allowFontScaling={false}
                className="font-bold text-[20px] text-zeno-green"
              >
                ZENO
              </Text>
            </View>
            <Text
              allowFontScaling={false}
              className="mt-1 font-bold text-[18px] text-zeno-text-primary"
            >
              Version 1.0.0
            </Text>
            <Text
              allowFontScaling={false}
              className="text-[13px] text-zeno-text-secondary"
            >
              Build 100
            </Text>

            <Text
              allowFontScaling={false}
              className="mt-4 px-6 text-center font-medium text-[14px] leading-[22px] text-zeno-text-secondary"
            >
              ZENO is a fast, secure and reliable fintech app that helps you send, receive and manage your money with ease.
            </Text>
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

            {/* Legal → shows legal info */}
            <Pressable
              onPress={handleLegal}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <Text
                allowFontScaling={false}
                className="font-semibold text-[17px] text-zeno-text-primary"
              >
                Legal
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

          {/* App Info Card */}
          <View className="mt-6 rounded-[28px] bg-white p-4 shadow-xs gap-y-3">
            <View className="flex-row justify-between py-2">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[15px] text-zeno-text-secondary"
              >
                Version
              </Text>
              <Text
                allowFontScaling={false}
                className="font-bold text-[15px] text-zeno-text-primary"
              >
                1.0.0 (Build 100)
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[15px] text-zeno-text-secondary"
              >
                Target Markets
              </Text>
              <Text
                allowFontScaling={false}
                className="font-bold text-[15px] text-zeno-text-primary"
              >
                Bénin, Côte d'Ivoire
              </Text>
            </View>
            <View className="flex-row justify-between py-2 border-t border-gray-100">
              <Text
                allowFontScaling={false}
                className="font-semibold text-[15px] text-zeno-text-secondary"
              >
                Infrastructure
              </Text>
              <Text
                allowFontScaling={false}
                className="font-bold text-[15px] text-zeno-text-primary"
              >
                Kollekt & Visa Direct
              </Text>
            </View>
          </View>

          {/* Copyright */}
          <Text
            allowFontScaling={false}
            className="mt-6 text-center text-[12px] text-zeno-text-secondary"
          >
            © 2025 ZENO Technologies. All rights reserved.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

