import { CloseIcon } from "@/components/ui/CloseIcon";
import { PIN_LENGTH, PinPad } from "@/components/auth/PinPad";
import { useSecurityStore } from "@/store/security-store";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";

type PinSecurityModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PinSecurityModal({ visible, onClose }: PinSecurityModalProps) {
  const { user } = useUser();
  const userId = user?.id ?? "demo_user";

  const verifyPin = useSecurityStore((s) => s.verifyPin);
  const setPin = useSecurityStore((s) => s.setPin);

  const [step, setStep] = useState<"verify_current" | "new_pin" | "confirm_pin">(
    "verify_current"
  );

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleResetState = () => {
    setStep("verify_current");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setErrorMsg(null);
  };

  const handleVerifyCurrentPin = async (enteredPin: string) => {
    setCurrentPin(enteredPin);
    setErrorMsg(null);

    const hasStoredPin = await useSecurityStore.getState().hasPin(userId);
    if (!hasStoredPin) {
      // If no PIN stored yet, move to creating new PIN
      setStep("new_pin");
      return;
    }

    const isValid = await verifyPin(userId, enteredPin);
    if (isValid) {
      setStep("new_pin");
    } else {
      setErrorMsg("PIN incorrect. Veuillez réessayez.");
      setCurrentPin("");
    }
  };

  const handleNewPinEntered = (enteredPin: string) => {
    setNewPin(enteredPin);
    setErrorMsg(null);
    setStep("confirm_pin");
  };

  const handleConfirmPinEntered = async (enteredPin: string) => {
    setConfirmPin(enteredPin);
    if (enteredPin !== newPin) {
      setErrorMsg("Les deux codes PIN ne correspondent pas.");
      setConfirmPin("");
      return;
    }

    const success = await setPin(userId, enteredPin);
    if (success) {
      Alert.alert(
        "PIN mis à jour",
        `Votre nouveau code PIN à ${PIN_LENGTH} chiffres a été enregistré.`
      );
      handleResetState();
      onClose();
    } else {
      setErrorMsg("Échec de l'enregistrement du PIN. Réessayez.");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        handleResetState();
        onClose();
      }}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[92%] rounded-t-[32px] bg-white p-6 shadow-2xl">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-bold text-[22px] text-zeno-text-primary">
              Sécurité du Code PIN
            </Text>
            <Pressable
              onPress={() => {
                handleResetState();
                onClose();
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="items-center py-2">
              <Text className="text-center font-bold text-[18px] text-zeno-text-primary">
                {step === "verify_current"
                  ? "Entrez votre PIN actuel"
                  : step === "new_pin"
                  ? "Définir le nouveau PIN"
                  : "Confirmer le nouveau PIN"}
              </Text>
              <Text className="mt-1 text-center font-medium text-[14px] text-zeno-text-secondary">
                {step === "verify_current"
                  ? `Saisissez votre code PIN à ${PIN_LENGTH} chiffres pour continuer`
                  : step === "new_pin"
                  ? `Entrez vos ${PIN_LENGTH} nouveaux chiffres`
                  : `Re-saisissez les ${PIN_LENGTH} chiffres du nouveau PIN`}
              </Text>

              {errorMsg && (
                <View className="mt-3 rounded-xl bg-red-50 px-4 py-2">
                  <Text className="font-bold text-[14px] text-red-600">
                    {errorMsg}
                  </Text>
                </View>
              )}

              <View className="mt-6 w-full items-center">
                {step === "verify_current" && (
                  <>
                    <PinPad
                      value={currentPin}
                      onChange={handleVerifyCurrentPin}
                    />
                    <Pressable
                      onPress={() => {
                        setErrorMsg(null);
                        setStep("new_pin");
                      }}
                      className="mt-6 py-2"
                      hitSlop={8}
                    >
                      <Text className="font-bold text-[16px] text-zeno-blue">
                        Code PIN oublié ? Réinitialiser le PIN
                      </Text>
                    </Pressable>
                  </>
                )}
                {step === "new_pin" && (
                  <PinPad value={newPin} onChange={handleNewPinEntered} />
                )}
                {step === "confirm_pin" && (
                  <PinPad
                    value={confirmPin}
                    onChange={handleConfirmPinEntered}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}




