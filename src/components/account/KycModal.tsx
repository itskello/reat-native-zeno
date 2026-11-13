import { images } from "@/constants/images";
import { startDiditVerification } from "@/features/kyc/kyc-service";
import type { CountryId } from "@/types/content";
import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguageStore } from "@/store/language-store";

type KycStatus = "verified" | "pending" | "unverified";

type KycModalProps = {
  visible: boolean;
  onClose: () => void;
  status: KycStatus;
  countryId?: CountryId;
  onStatusChange?: (newStatus: KycStatus) => void;
};

const DIDIT_PRIVACY_URL = "https://didit.me/terms/verification-privacy-notice/";
const DIDIT_TERMS_URL = "https://didit.me/terms/identity-verification/";

function localize(language: "en" | "fr", en: string, fr: string) {
  return language === "fr" ? fr : en;
}

export function KycModal({
  visible,
  onClose,
  status,
  countryId = "benin",
  onStatusChange,
}: KycModalProps) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = (en: string, fr: string) => localize(language, en, fr);
  const isPending = status === "pending";

  const close = () => {
    setConsentAccepted(false);
    setError("");
    setSubmitting(false);
    onClose();
  };

  const startVerification = async () => {
    if (!isPending && !consentAccepted) return;
    if (Platform.OS === "web") {
      setError(t(
        "Identity verification must be completed in the ZENO mobile app.",
        "La vérification d’identité doit être effectuée dans l’application mobile ZENO.",
      ));
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError(t("Your session has expired. Sign in again and retry.", "Votre session a expiré. Reconnectez-vous puis réessayez."));
        return;
      }

      const session = await startDiditVerification(token, countryId, language);
      if (!session.ok) {
        setError(t(session.error, session.errorFr));
        return;
      }

      onStatusChange?.("pending");
      const { startVerification: startNativeVerification } = await import(
        "@didit-protocol/sdk-react-native"
      );
      const result = await startNativeVerification(session.sessionToken, {
        languageCode: language,
        showLanguageSelector: false,
        showCloseButton: true,
        showExitConfirmation: true,
        closeOnComplete: true,
        loggingEnabled: false,
      });

      if (result.type === "completed") {
        setError("");
        return;
      }

      if (result.type === "cancelled") {
        setError(t(
          "Verification paused. Continue it here whenever you are ready.",
          "La vérification est en pause. Vous pourrez la reprendre ici quand vous serez prêt.",
        ));
        return;
      }

      const message = result.error.type === "cameraAccessDenied"
        ? t(
            "Camera access is required. Allow it in your phone settings, then try again.",
            "L’accès à la caméra est nécessaire. Autorisez-le dans les réglages du téléphone, puis réessayez.",
          )
        : result.error.type === "networkError"
          ? t(
              "Check your internet connection and try again.",
              "Vérifiez votre connexion Internet puis réessayez.",
            )
          : t(
              "The verification could not start. Please try again.",
              "La vérification n’a pas pu démarrer. Veuillez réessayer.",
            );
      setError(message);
    } catch {
      setError(t(
        "We could not start the native verification. Please try again.",
        "Impossible de démarrer la vérification native. Veuillez réessayer.",
      ));
    } finally {
      setSubmitting(false);
    }
  };

  const openLegalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setError(t("This page could not be opened.", "Impossible d’ouvrir cette page."));
    }
  };

  const mainButton = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`h-[58px] items-center justify-center rounded-full ${disabled ? "bg-[#DDE6EA]" : "bg-zeno-green"}`}
    >
      <Text className={`font-semibold text-[17px] ${disabled ? "text-[#7D8782]" : "text-zeno-dark"}`}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <View className="flex-1 bg-[#EAF6FF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-row items-center px-5 pb-3 pt-2">
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t("Back", "Retour")} className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low">
            <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
          </Pressable>
          <Text className="ml-3 flex-1 text-center font-semibold text-[17px] text-zeno-text-primary">{t("Verify your identity", "Vérifiez votre identité")}</Text>
          <View className="h-[46px] w-[46px]" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false}>
          {!isPending ? (
            <View className="flex-1">
              <Text className="mt-5 font-bold text-[28px] leading-[34px] text-zeno-text-primary">{t("Identity verification", "Vérification d’identité")}</Text>
              <View className="mt-8 h-[230px] items-center justify-center rounded-[32px] bg-[#DDF4FF]">
                <View className="absolute left-12 top-7 h-32 w-32 rounded-[28px] bg-zeno-green/60" />
                <View className="absolute bottom-7 right-12 h-32 w-32 rounded-[28px] bg-white/80" />
                <View className="h-32 w-32 items-center justify-center rounded-[32px] bg-zeno-dark shadow-lg">
                  <Text className="text-[60px] text-zeno-green">✓</Text>
                </View>
                <View className="absolute bottom-7 rounded-full bg-white px-4 py-2">
                  <Text className="font-semibold text-[13px] text-zeno-dark">ZENO · DIDIT</Text>
                </View>
              </View>

              <Text className="mt-6 text-center text-[16px] leading-[24px] text-zeno-text-primary">
                {t(
                  "ZENO uses Didit’s native verification screens inside the app. You can capture your identity document and complete the requested checks without leaving ZENO.",
                  "ZENO utilise les écrans de vérification natifs de Didit dans l’application. Vous pouvez photographier votre pièce et effectuer les contrôles demandés sans quitter ZENO.",
                )}
              </Text>
              <View className="mt-5 flex-row items-center justify-center rounded-[18px] bg-white px-4 py-3">
                <Text className="mr-2 text-[18px] text-zeno-blue">◷</Text>
                <Text className="text-[14px] text-zeno-text-secondary">{t("Have your ID and about 5 minutes ready.", "Préparez votre pièce d’identité et environ 5 minutes.")}</Text>
              </View>

              <View className="mt-5 rounded-[20px] bg-white p-4">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: consentAccepted }}
                  onPress={() => setConsentAccepted((accepted) => !accepted)}
                  className="flex-row items-start"
                >
                  <View className={`mt-0.5 h-6 w-6 items-center justify-center rounded-md border ${consentAccepted ? "border-zeno-green bg-zeno-green" : "border-[#A9B7C0] bg-white"}`}>
                    {consentAccepted ? <Text className="font-bold text-[15px] text-zeno-dark">✓</Text> : null}
                  </View>
                  <Text className="ml-3 flex-1 text-[14px] leading-[21px] text-zeno-text-primary">
                    {t(
                      "I understand that Didit will process my identity document and face data to verify my identity, and I agree to continue.",
                      "Je comprends que Didit traitera ma pièce d’identité et mes données faciales pour vérifier mon identité, et j’accepte de continuer.",
                    )}
                  </Text>
                </Pressable>
                <View className="ml-9 mt-3 flex-row flex-wrap">
                  <Pressable accessibilityRole="link" onPress={() => void openLegalLink(DIDIT_PRIVACY_URL)}>
                    <Text className="font-medium text-[13px] text-zeno-blue underline">{t("Didit Privacy Notice", "Notice de confidentialité Didit")}</Text>
                  </Pressable>
                  <Text className="mx-1 text-[13px] text-zeno-text-secondary">·</Text>
                  <Pressable accessibilityRole="link" onPress={() => void openLegalLink(DIDIT_TERMS_URL)}>
                    <Text className="font-medium text-[13px] text-zeno-blue underline">{t("End User Terms", "Conditions d’utilisation")}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <View className="items-center pt-14">
              <View className="h-28 w-28 items-center justify-center rounded-full bg-zeno-green">
                <Text className="text-[54px] text-zeno-dark">✓</Text>
              </View>
              <Text className="mt-7 text-center font-bold text-[27px] leading-[34px] text-zeno-text-primary">{t("Verification in progress", "Vérification en cours")}</Text>
              <Text className="mt-4 text-center text-[16px] leading-[24px] text-zeno-text-secondary">
                {t(
                  "Resume your native Didit verification here. ZENO will update your account when Didit sends the final result.",
                  "Reprenez ici votre vérification native Didit. ZENO mettra votre compte à jour dès que Didit aura envoyé le résultat final.",
                )}
              </Text>
            </View>
          )}

          {error ? <Text accessibilityRole="alert" className="mt-5 rounded-[16px] bg-[#FEECEC] px-4 py-3 text-[14px] leading-[20px] text-[#B42318]">{error}</Text> : null}
        </ScrollView>

        <View className="px-5 pb-4 pt-2">
          {!isPending
            ? mainButton(
                submitting ? t("Preparing verification…", "Préparation de la vérification…") : t("Start verification", "Commencer la vérification"),
                () => void startVerification(),
                submitting || !consentAccepted,
              )
            : mainButton(
                submitting ? t("Preparing verification…", "Préparation de la vérification…") : t("Continue verification", "Reprendre la vérification"),
                () => void startVerification(),
                submitting,
              )}
        </View>
      </View>
    </Modal>
  );
}
