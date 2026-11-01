import { images } from "@/constants/images";
import { supportedCountries } from "@/data/countries";
import { submitKycVerification, type KycCapture } from "@/features/kyc/kyc-service";
import type { CountryId, KycDocumentType } from "@/types/content";
import { useAuth } from "@clerk/expo";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguageStore } from "@/store/language-store";

type KycStatus = "verified" | "pending" | "unverified";
type Step = "intro" | "document" | "front" | "back" | "selfie" | "review" | "pending";

type KycModalProps = {
  visible: boolean;
  onClose: () => void;
  status: KycStatus;
  countryId?: CountryId;
  onStatusChange?: (newStatus: KycStatus) => void;
};

const documentLabels: Record<KycDocumentType, { en: string; fr: string; noteEn: string; noteFr: string }> = {
  national_id: { en: "National identity card", fr: "Carte nationale d’identité", noteEn: "Biometric or ANIP card", noteFr: "Carte biométrique ou ANIP" },
  passport: { en: "Passport", fr: "Passeport", noteEn: "A valid identity page", noteFr: "Page d’identité en cours de validité" },
  drivers_license: { en: "Driving licence", fr: "Permis de conduire", noteEn: "Official government-issued licence", noteFr: "Permis officiel délivré par l’État" },
};

function localize(language: "en" | "fr", en: string, fr: string) {
  return language === "fr" ? fr : en;
}

export function KycModal({ visible, onClose, status, countryId = "benin", onStatusChange }: KycModalProps) {
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const language = useLanguageStore((state) => state.language);
  const [step, setStep] = useState<Step>("intro");
  const [selectedDoc, setSelectedDoc] = useState<KycDocumentType | null>("national_id");
  const [front, setFront] = useState<KycCapture | null>(null);
  const [back, setBack] = useState<KycCapture | null>(null);
  const [selfie, setSelfie] = useState<KycCapture | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const t = (en: string, fr: string) => localize(language, en, fr);
  const activeStep: Step = status === "pending" ? "pending" : step;
  const isPending = activeStep === "pending";
  const documentTypes = supportedCountries.find((country) => country.id === countryId)?.kycDocuments ?? supportedCountries[0].kycDocuments;
  const title = t("Verify your identity", "Vérifiez votre identité");

  const reset = () => {
    setStep("intro");
    setSelectedDoc(null);
    setFront(null);
    setBack(null);
    setSelfie(null);
    setError("");
    setSubmitting(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const goBack = () => {
    setError("");
    if (step === "document") setStep("intro");
    else if (step === "front") setStep("document");
    else if (step === "back") setStep("front");
    else if (step === "selfie") setStep(selectedDoc === "passport" ? "front" : "back");
    else if (step === "review") setStep("selfie");
    else if (step === "pending") close();
    else close();
  };

  const capture = async (kind: "front" | "back" | "selfie") => {
    setError("");
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(t("Allow camera access in your phone settings to take this photo.", "Autorisez l’accès à la caméra dans les réglages du téléphone pour prendre cette photo."));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        cameraType: kind === "selfie" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const photo: KycCapture = {
        uri: asset.uri,
        name: `${kind}-${Date.now()}.jpg`,
        type: asset.mimeType ?? "image/jpeg",
      };
      if (kind === "front") setFront(photo);
      else if (kind === "back") setBack(photo);
      else setSelfie(photo);
    } catch {
      setError(t("The camera could not be opened. Check camera access and try again.", "Impossible d’ouvrir la caméra. Vérifiez son autorisation puis réessayez."));
    }
  };

  const submit = async () => {
    if (!selectedDoc || !front || !selfie || ((selectedDoc === "national_id" || selectedDoc === "drivers_license") && !back)) return;
    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) {
        setError(t("Your session has expired. Sign in again and retry.", "Votre session a expiré. Reconnectez-vous puis réessayez."));
        return;
      }
      const result = await submitKycVerification(token, {
        countryId,
        documentType: selectedDoc,
        front,
        back: back ?? undefined,
        selfie,
      });
      if (!result.ok) {
        setError(t(result.error, result.errorFr));
        return;
      }
      setStep("pending");
      onStatusChange?.("pending");
    } catch {
      setError(t("We could not submit your verification. Please try again.", "Impossible d’envoyer votre dossier. Veuillez réessayer."));
    } finally {
      setSubmitting(false);
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

  const capturePanel = (photo: KycCapture | null, onCapture: () => void, captureLabel: string) => (
    <Pressable
      onPress={onCapture}
      accessibilityRole="button"
      accessibilityLabel={photo ? t("Retake photo", "Reprendre la photo") : captureLabel}
      className="h-[210px] items-center justify-center overflow-hidden rounded-[24px] border border-[#D9E4E9] bg-[#EAF6FF]"
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          <View className="absolute bottom-3 rounded-full bg-zeno-dark/85 px-4 py-2">
            <Text className="text-[13px] font-semibold text-white">{t("Tap to retake", "Toucher pour reprendre")}</Text>
          </View>
        </>
      ) : (
        <View className="items-center px-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-zeno-green">
            <Text className="text-[28px] text-zeno-dark">{"▣"}</Text>
          </View>
          <Text className="mt-4 font-semibold text-[16px] text-zeno-text-primary">{captureLabel}</Text>
          <Text className="mt-1 text-center text-[13px] text-zeno-text-secondary">{t("Your photo stays on this screen until you submit it.", "La photo reste sur cet écran jusqu’à l’envoi du dossier.")}</Text>
        </View>
      )}
    </Pressable>
  );

  const captureStep = activeStep === "front" || activeStep === "back" || activeStep === "selfie";
  const photo = activeStep === "front" ? front : activeStep === "back" ? back : selfie;
  const captureAction = () => capture(activeStep as "front" | "back" | "selfie");
  const captureTitle = activeStep === "selfie"
    ? t("Take a selfie", "Prenez un selfie")
    : selectedDoc === "passport"
      ? t("Photograph the passport identity page", "Photographiez la page d’identité du passeport")
      : activeStep === "back"
        ? t("Photograph the back of your document", "Photographiez le verso de votre document")
        : t("Photograph the front of your document", "Photographiez le recto de votre document");

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <View className="flex-1 bg-[#EAF6FF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <View className="flex-row items-center px-5 pb-3 pt-2">
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel={t("Back", "Retour")} className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low">
            <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
          </Pressable>
          <Text className="ml-3 flex-1 text-center font-semibold text-[17px] text-zeno-text-primary">{title}</Text>
          <View className="h-[46px] w-[46px]" />
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {activeStep === "intro" && (
            <View className="flex-1">
              <Text className="mt-5 font-bold text-[28px] leading-[34px] text-zeno-text-primary">{t("Identity verification", "Vérification d’identité")}</Text>
              <View className="mt-10 h-[270px] items-center justify-center rounded-[32px] bg-[#DDF4FF]">
                <View className="absolute left-12 top-8 h-36 w-36 rounded-[28px] bg-zeno-green/60" />
                <View className="absolute bottom-8 right-12 h-36 w-36 rounded-[28px] bg-white/80" />
                <View className="h-36 w-36 items-center justify-center rounded-[32px] bg-zeno-dark shadow-lg">
                  <Text className="text-[64px] text-zeno-green">✓</Text>
                </View>
                <View className="absolute bottom-8 rounded-full bg-white px-4 py-2">
                  <Text className="font-semibold text-[13px] text-zeno-dark">ZENO · KYC</Text>
                </View>
              </View>
              <Text className="mt-8 text-center text-[16px] leading-[24px] text-zeno-text-primary">
                {t("Verify your identity to help protect your account and unlock more ZENO services.", "Vérifiez votre identité pour protéger votre compte et accéder aux services ZENO.")}
              </Text>
              <View className="mt-5 flex-row items-center justify-center rounded-[18px] bg-white px-4 py-3">
                <Text className="mr-2 text-[18px] text-zeno-blue">◷</Text>
                <Text className="text-[14px] text-zeno-text-secondary">{t("Have your ID and about 5 minutes ready.", "Préparez votre pièce d’identité et environ 5 minutes.")}</Text>
              </View>
            </View>
          )}

          {activeStep === "document" && (
            <View className="pt-5">
              <Text className="font-bold text-[26px] leading-[32px] text-zeno-text-primary">{t("Choose an identity document", "Présentez un justificatif d’identité")}</Text>
              <Text className="mt-3 text-[16px] leading-[23px] text-zeno-text-secondary">{t("Use a valid document with a clear, readable photo.", "Choisissez un document valide avec une photo nette et lisible.")}</Text>
              <View className="mt-7 gap-y-3">
                {documentTypes.map((type, index) => {
                  const selected = selectedDoc === type;
                  const labels = type === "national_id"
                    ? {
                        en: countryId === "benin" ? "Biometric identity card" : "National identity card",
                        fr: countryId === "benin" ? "Carte d’identité biométrique" : "Carte nationale d’identité",
                        noteEn: countryId === "benin" ? "ANIP national identity card" : "Government-issued national ID",
                        noteFr: countryId === "benin" ? "Carte nationale ANIP" : "Carte nationale officielle",
                      }
                    : documentLabels[type];
                  return (
                    <Pressable key={type} onPress={() => setSelectedDoc(type)} className={`flex-row items-center rounded-[22px] border p-4 ${selected ? "border-zeno-blue bg-[#EAF6FF]" : "border-[#DCE5E9] bg-white"}`}>
                      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${selected ? "bg-zeno-green" : "bg-[#F1F6F8]"}`}>
                        <Text className="text-[23px] text-zeno-dark">{type === "passport" ? "▤" : type === "drivers_license" ? "▱" : "▣"}</Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-semibold text-[16px] text-zeno-text-primary">{localize(language, labels.en, labels.fr)}</Text>
                        <Text className="mt-1 text-[13px] text-zeno-text-secondary">{localize(language, labels.noteEn, labels.noteFr)}</Text>
                      </View>
                      {index === 0 ? <View className="rounded-full bg-zeno-green px-2.5 py-1"><Text className="font-semibold text-[11px] text-zeno-dark">{t("Recommended", "Recommandé")}</Text></View> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {captureStep && (
            <View className="pt-5">
              <Text className="font-bold text-[26px] leading-[32px] text-zeno-text-primary">{captureTitle}</Text>
              <Text className="mt-3 text-[16px] leading-[23px] text-zeno-text-secondary">{step === "selfie" ? t("Keep your face centered and remove anything covering it.", "Gardez votre visage au centre et retirez ce qui pourrait le couvrir.") : t("Make sure every edge and detail is visible and in focus.", "Assurez-vous que les bords et les informations sont visibles et nets.")}</Text>
              <View className="mt-6">{capturePanel(photo, captureAction, t("Open camera", "Ouvrir la caméra"))}</View>
              <View className="mt-5 gap-y-3">
                {[
                  t("Use a well-lit room.", "Installez-vous dans une pièce bien éclairée."),
                  step === "selfie" ? t("Look directly at the camera and keep a neutral expression.", "Regardez l’objectif et gardez une expression neutre.") : t("Hold the document flat without hiding any information.", "Tenez le document à plat sans masquer d’information."),
                  t("Avoid glare, blur and cropped edges.", "Évitez les reflets, le flou et les bords coupés."),
                ].map((hint) => <View key={hint} className="flex-row items-start rounded-[16px] bg-white px-4 py-3"><Text className="mr-3 font-bold text-[18px] text-zeno-blue">•</Text><Text className="flex-1 text-[14px] leading-[20px] text-zeno-text-primary">{hint}</Text></View>)}
              </View>
            </View>
          )}

          {activeStep === "review" && (
            <View className="pt-5">
              <Text className="font-bold text-[26px] leading-[32px] text-zeno-text-primary">{t("Review your photos", "Vérifiez vos photos")}</Text>
              <Text className="mt-3 text-[15px] leading-[22px] text-zeno-text-secondary">{t("Your documents will be sent securely for review. ZENO will show the result after the verification provider responds.", "Vos pièces seront envoyées de manière sécurisée. ZENO affichera le résultat après la réponse du service de vérification.")}</Text>
              <View className="mt-6 gap-y-3">
                {[{ label: t("Document front", "Recto du document"), image: front }, ...(back ? [{ label: t("Document back", "Verso du document"), image: back }] : []), { label: t("Selfie", "Selfie"), image: selfie }].map(({ label, image: item }) => (
                  <View key={label} className="flex-row items-center rounded-[20px] bg-white p-3">
                    {item ? <Image source={{ uri: item.uri }} contentFit="cover" style={{ width: 74, height: 58, borderRadius: 12 }} /> : null}
                    <Text className="ml-3 flex-1 font-semibold text-[15px] text-zeno-text-primary">{label}</Text>
                    <Text className="mr-2 text-[18px] text-[#22C55E]">✓</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {isPending && (
            <View className="items-center pt-14">
              <View className="h-28 w-28 items-center justify-center rounded-full bg-zeno-green">
                <Text className="text-[54px] text-zeno-dark">✓</Text>
              </View>
              <Text className="mt-7 text-center font-bold text-[27px] leading-[34px] text-zeno-text-primary">{t("Verification submitted", "Demande envoyée")}</Text>
              <Text className="mt-4 text-center text-[16px] leading-[24px] text-zeno-text-secondary">{t("Your identity check is waiting for review. We’ll update your account when the review is complete.", "Votre dossier est en attente d’examen. Votre compte sera mis à jour dès que la vérification sera terminée.")}</Text>
              <View className="mt-6 w-full rounded-[20px] bg-white p-4">
                <Text className="font-semibold text-[14px] text-zeno-text-primary">{t("Current status", "Statut actuel")}</Text>
                <Text className="mt-1 text-[14px] text-zeno-text-secondary">{t("Pending review", "En cours de vérification")}</Text>
              </View>
            </View>
          )}
          {error ? <Text accessibilityRole="alert" className="mt-5 rounded-[16px] bg-[#FEECEC] px-4 py-3 text-[14px] leading-[20px] text-[#B42318]">{error}</Text> : null}
        </ScrollView>

        <View className="px-5 pb-4 pt-2">
          {activeStep === "intro" && mainButton(t("Verify my identity", "Vérifier mon identité"), () => setStep("document"))}
          {activeStep === "document" && mainButton(t("Continue", "Continuer"), () => setStep("front"), !selectedDoc)}
          {activeStep === "front" && mainButton(front ? t("Continue", "Continuer") : t("Take photo", "Prendre la photo"), async () => {
            if (!front) return capture("front");
            setStep(selectedDoc === "passport" ? "selfie" : "back");
          })}
          {activeStep === "back" && mainButton(back ? t("Continue", "Continuer") : t("Take photo", "Prendre la photo"), async () => {
            if (!back) return capture("back");
            setStep("selfie");
          })}
          {activeStep === "selfie" && mainButton(selfie ? t("Review photos", "Vérifier les photos") : t("Take selfie", "Prendre un selfie"), async () => {
            if (!selfie) return capture("selfie");
            setStep("review");
          })}
          {activeStep === "review" && mainButton(submitting ? t("Sending…", "Envoi…") : t("Submit for review", "Envoyer pour vérification"), submit, submitting)}
          {isPending && mainButton(t("Done", "Terminer"), close)}
        </View>
      </View>
    </Modal>
  );
}
