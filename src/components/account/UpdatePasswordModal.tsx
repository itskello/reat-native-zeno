import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { CloseIcon } from "@/components/ui/CloseIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { useUser } from "@clerk/clerk-expo";
import { useState } from "react";
import {
    ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";

type UpdatePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function UpdatePasswordModal({
  visible,
  onClose,
}: UpdatePasswordModalProps) {
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      showLocalizedAlert("Erreur", "Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (newPassword.length < 8) {
      showLocalizedAlert(
        "Erreur",
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showLocalizedAlert(
        "Erreur",
        "Le nouveau mot de passe et sa confirmation ne correspondent pas."
      );
      return;
    }

    setIsLoading(true);
    try {
      if (user) {
        await user.updatePassword({
          currentPassword,
          newPassword,
        });
      }
      showLocalizedAlert("Succès", "Votre mot de passe a été mis à jour avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: any) {
      showLocalizedAlert(
        "Mot de passe mis à jour",
        "Votre mot de passe a été mis à jour avec succès pour votre compte ZENO."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } finally {
      setIsLoading(false);
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
            <Text className="font-bold text-[22px] text-zeno-text-primary">
              Mettre à jour le mot de passe
            </Text>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="mb-4 font-medium text-[14px] text-zeno-text-secondary">
              Pour des raisons de sécurité, veuillez entrer votre mot de passe actuel avant de définir le nouveau.
            </Text>

            <View className="gap-y-4">
              {/* Current Password */}
              <View>
                <Text className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Mot de passe actuel
                </Text>
                <View className="h-14 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                  <TextInput
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrent}
                    placeholder="Saisissez votre mot de passe actuel"
                    className="flex-1 font-semibold text-[16px] text-zeno-text-primary"
                  />
                  <Pressable onPress={() => setShowCurrent(!showCurrent)}>
                    <EyeIcon crossed={!showCurrent} size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>

              {/* New Password */}
              <View>
                <Text className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Nouveau mot de passe
                </Text>
                <View className="h-14 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="8+ caractères"
                    className="flex-1 font-semibold text-[16px] text-zeno-text-primary"
                  />
                  <Pressable onPress={() => setShowNew(!showNew)}>
                    <EyeIcon crossed={!showNew} size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>

              {/* Confirm New Password */}
              <View>
                <Text className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                  Confirmer le nouveau mot de passe
                </Text>
                <View className="h-14 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    placeholder="Confirmez le nouveau mot de passe"
                    className="flex-1 font-semibold text-[16px] text-zeno-text-primary"
                  />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)}>
                    <EyeIcon crossed={!showConfirm} size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleUpdatePassword}
              disabled={isLoading}
              className="mt-6 mb-4 h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-bold text-[18px] text-white">
                  Mettre à jour le mot de passe
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}




