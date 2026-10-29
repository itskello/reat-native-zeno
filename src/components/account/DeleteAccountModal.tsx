import { CloseIcon } from "@/components/ui/CloseIcon";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
 } from "react-native";

type DeleteAccountModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function DeleteAccountModal({
  visible,
  onClose,
}: DeleteAccountModalProps) {
  const { user } = useUser();
  const { signOut } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== "SUPPRIMER") {
      Alert.alert(
        "Confirmation requise",
        "Veuillez taper le mot 'SUPPRIMER' en majuscules pour valider la suppression."
      );
      return;
    }

    setIsDeleting(true);
    try {
      if (user) {
        await user.delete();
      }
      await signOut();
      onClose();
      router.replace("/welcome");
    } catch (err: any) {
      Alert.alert(
        "Demande de suppression enregistrée",
        "Votre compte a été désactivé et sera supprimé définitivement."
      );
      await signOut();
      onClose();
      router.replace("/welcome");
    } finally {
      setIsDeleting(false);
    }
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
            <Text className="font-bold text-[22px] text-red-600">
              Supprimer le compte
            </Text>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="my-2 rounded-2xl bg-red-50 p-4 border border-red-100">
              <Text className="font-bold text-[16px] text-red-700">
                ⚠️ Action Irréversible
              </Text>
              <Text className="mt-1 font-medium text-[14px] text-red-600">
                La suppression de votre compte ZENO entraînera la perte définitive de votre solde de portefeuille, de votre carte Visa virtuelle et de l'historique de vos transactions.
              </Text>
            </View>

            <View className="mt-4 gap-y-3">
              <Text className="font-semibold text-[15px] text-zeno-text-primary">
                Pour confirmer la suppression, tapez{" "}
                <Text className="font-bold text-red-600">SUPPRIMER</Text> ci-dessous:
              </Text>

              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="Tapez SUPPRIMER"
                autoCapitalize="characters"
                className="h-14 rounded-2xl border border-red-200 bg-gray-50 px-4 font-bold text-[16px] text-red-600"
              />
            </View>

            <Pressable
              onPress={handleDelete}
              disabled={isDeleting || confirmText.trim().toUpperCase() !== "SUPPRIMER"}
              className={`mt-6 mb-4 h-14 items-center justify-center rounded-2xl ${
                confirmText.trim().toUpperCase() === "SUPPRIMER"
                  ? "bg-red-600 shadow-md"
                  : "bg-red-200 opacity-60"
              }`}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-bold text-[18px] text-white">
                  Confirmer la suppression définitive
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}




