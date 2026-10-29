import { VerifiedBadgeIcon, CloseIcon, CheckBadgeIcon, StarCelebrationIcon } from "@/components/ui/ProfileIcons";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

type KycModalProps = {
  visible: boolean;
  onClose: () => void;
  status: "verified" | "pending" | "unverified";
  onStatusChange?: (newStatus: "verified" | "pending" | "unverified") => void;
};

export function KycModal({
  visible,
  onClose,
  status: initialStatus = "verified",
  onStatusChange,
}: KycModalProps) {
  const [currentStatus, setCurrentStatus] = useState<
    "verified" | "pending" | "unverified"
  >(initialStatus);
  const [selectedDoc, setSelectedDoc] = useState<
    "cni" | "passport" | "driver_license"
  >("cni");
  const [step, setStep] = useState<"overview" | "upload" | "selfie" | "success">(
    "overview"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartVerification = () => {
    setStep("upload");
  };

  const handleDocumentSubmit = () => {
    setStep("selfie");
  };

  const handleSelfieSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setCurrentStatus("verified");
      onStatusChange?.("verified");
      setStep("success");
    }, 1500);
  };

  const handleReset = () => {
    setStep("overview");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[90%] rounded-t-[32px] bg-white p-6 shadow-2xl">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-bold text-[22px] text-zeno-text-primary">
              KYC & Identité
            </Text>
            <Pressable
              onPress={() => {
                handleReset();
                onClose();
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === "overview" && (
              <View className="gap-y-5 py-2">
                {/* Status Header */}
                <View className="flex-row items-center rounded-2xl bg-[#D1FAD7] p-4">
                  <VerifiedBadgeIcon size={32} />
                  <View className="ml-3 flex-1">
                    <Text className="font-bold text-[18px] text-[#071706]">
                      Statut: {currentStatus === "verified" ? "Vérifié 100%" : currentStatus === "pending" ? "En cours d'examen" : "Non Vérifié"}
                    </Text>
                    <Text className="font-medium text-[13px] text-gray-600">
                      Votre identité est confirmée. Vous bénéficiez des plafonds maximaux de transfert et retrait.
                    </Text>
                  </View>
                </View>

                <View className="gap-y-3">
                  <Text className="font-bold text-[16px] text-zeno-text-primary">
                    Avantages du compte vérifié
                  </Text>
                  <View className="flex-row items-center gap-x-3">
                    <CheckBadgeIcon size={20} color="#22C55E" />
                    <Text className="font-semibold text-[15px] text-gray-700">
                      Transferts d'argent illimités vers Mobile Money
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-3">
                    <CheckBadgeIcon size={20} color="#22C55E" />
                    <Text className="font-semibold text-[15px] text-gray-700">
                      Création de cartes Visa virtuelles sans restriction
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-x-3">
                    <CheckBadgeIcon size={20} color="#22C55E" />
                    <Text className="font-semibold text-[15px] text-gray-700">
                      Liens de paiement et demandes d'argent actifs
                    </Text>
                  </View>
                </View>

                {currentStatus !== "verified" ? (
                  <Pressable
                    onPress={handleStartVerification}
                    className="mt-4 h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
                  >
                    <Text className="font-bold text-[18px] text-white">
                      Commencer la vérification
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      Alert.alert(
                        "Identité déjà vérifiée",
                        "Votre pièce d'identité officielle et votre selfie ont déjà été vérifiés par Smile Identity."
                      );
                    }}
                    className="mt-4 h-14 items-center justify-center rounded-2xl bg-gray-100 border border-gray-200"
                  >
                    <Text className="font-bold text-[16px] text-gray-700">
                      Re-soumettre un document
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {step === "upload" && (
              <View className="gap-y-4 py-2">
                <Text className="font-bold text-[18px] text-zeno-text-primary">
                  Choisissez un document d'identité
                </Text>

                <Pressable
                  onPress={() => setSelectedDoc("cni")}
                  className={`flex-row items-center rounded-2xl p-4 border ${
                    selectedDoc === "cni"
                      ? "border-zeno-blue bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text className="text-[24px]">🪪</Text>
                  <View className="ml-3">
                    <Text className="font-bold text-[16px] text-zeno-text-primary">
                      Carte Nationale d'Identité (CNI)
                    </Text>
                    <Text className="text-[13px] text-gray-500">
                      Bénin, Côte d'Ivoire & UEMOA
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedDoc("passport")}
                  className={`flex-row items-center rounded-2xl p-4 border ${
                    selectedDoc === "passport"
                      ? "border-zeno-blue bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text className="text-[24px]">🛂</Text>
                  <View className="ml-3">
                    <Text className="font-bold text-[16px] text-zeno-text-primary">
                      Passeport International
                    </Text>
                    <Text className="text-[13px] text-gray-500">
                      Passeport biométrique valide
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setSelectedDoc("driver_license")}
                  className={`flex-row items-center rounded-2xl p-4 border ${
                    selectedDoc === "driver_license"
                      ? "border-zeno-blue bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text className="text-[24px]">🚘</Text>
                  <View className="ml-3">
                    <Text className="font-bold text-[16px] text-zeno-text-primary">
                      Permis de Conduire
                    </Text>
                    <Text className="text-[13px] text-gray-500">
                      Permis de conduire officiel
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={handleDocumentSubmit}
                  className="mt-4 h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
                >
                  <Text className="font-bold text-[18px] text-white">
                    Continuer vers la capture
                  </Text>
                </Pressable>
              </View>
            )}

            {step === "selfie" && (
              <View className="items-center gap-y-4 py-4">
                <Text className="font-bold text-[20px] text-zeno-text-primary">
                  Vérification Biométrique
                </Text>
                <Text className="text-center font-medium text-[15px] text-gray-600">
                  Prenez une photo claire de votre visage (Selfie) pour valider votre identité avec la pièce fournie.
                </Text>

                <View className="my-4 h-44 w-44 items-center justify-center rounded-full border-4 border-dashed border-zeno-blue bg-gray-100">
                  <Text className="text-[48px]">📸</Text>
                </View>

                <Pressable
                  onPress={handleSelfieSubmit}
                  disabled={isSubmitting}
                  className="mt-2 h-14 w-full items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="font-bold text-[18px] text-white">
                      Capturer & Soumettre
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {step === "success" && (
              <View className="items-center gap-y-4 py-6">
                <StarCelebrationIcon size={72} />
                <Text className="font-bold text-[22px] text-zeno-text-primary">
                  Vérification Réussie !
                </Text>
                <Text className="text-center font-medium text-[15px] text-gray-600">
                  Votre identité a été vérifiée avec succès par Smile Identity. Votre compte ZENO est désormais 100% fonctionnel et sécurisé.
                </Text>

                <Pressable
                  onPress={() => {
                    handleReset();
                    onClose();
                  }}
                  className="mt-4 h-14 w-full items-center justify-center rounded-2xl bg-zeno-green shadow-md"
                >
                  <Text className="font-bold text-[18px] text-zeno-dark">
                    Terminer
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


