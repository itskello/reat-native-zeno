import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, Text, View } from "react-native";

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function LogoutModal({ visible, onClose }: LogoutModalProps) {
  const { signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      onClose();
      router.replace("/welcome");
    } catch (err: any) {
      Alert.alert(
        "Déconnexion réussie",
        "Vous avez été déconnecté avec succès."
      );
      onClose();
      router.replace("/welcome");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
          <View className="items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Text className="text-[32px]">🚪</Text>
            </View>

            <Text className="font-bold text-[22px] text-zeno-text-primary">
              Déconnexion
            </Text>
            <Text className="mt-2 text-center font-medium text-[15px] text-zeno-text-secondary">
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ZENO ?
            </Text>
          </View>

          <View className="mt-6 flex-row gap-x-3">
            <Pressable
              onPress={onClose}
              disabled={isLoggingOut}
              className="flex-1 h-14 items-center justify-center rounded-2xl bg-gray-100"
            >
              <Text className="font-bold text-[16px] text-gray-700">
                Annuler
              </Text>
            </Pressable>

            <Pressable
              onPress={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
            >
              {isLoggingOut ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-bold text-[16px] text-white">
                  Déconnexion
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
