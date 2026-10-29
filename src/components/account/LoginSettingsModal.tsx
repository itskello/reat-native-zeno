import { CloseIcon } from "@/components/ui/CloseIcon";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";

type LoginSettingsModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function LoginSettingsModal({
  visible,
  onClose,
}: LoginSettingsModalProps) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [smsAuthEnabled, setSmsAuthEnabled] = useState(false);

  const handleRevokeOtherSessions = () => {
    Alert.alert(
      "Déconnexion des autres appareils",
      "Toutes les autres sessions actives ont été fermées avec succès."
    );
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
              Paramètres de Connexion
            </Text>
            <Pressable
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
            >
              <CloseIcon size={14} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Active Session Info */}
            <View className="mb-6 rounded-2xl bg-gray-50 p-4 border border-gray-100">
              <Text className="font-semibold text-[13px] uppercase tracking-wider text-zeno-text-secondary">
                Appareil Actuel
              </Text>
              <View className="mt-2 flex-row items-center justify-between">
                <View>
                  <Text className="font-bold text-[16px] text-zeno-text-primary">
                    Smartphone Principal (Expo Client)
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    Actif actuellement • Cotonou, Bénin
                  </Text>
                </View>
                <View className="rounded-full bg-green-100 px-3 py-1">
                  <Text className="font-semibold text-[12px] text-green-700">
                    En ligne
                  </Text>
                </View>
              </View>
            </View>

            {/* Security Options */}
            <View className="gap-y-4">
              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-[16px] text-zeno-text-primary">
                    Double Authentification (2FA)
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    Demander un code OTP à chaque nouvelle connexion
                  </Text>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={setTwoFactorEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#0057FF" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-[16px] text-zeno-text-primary">
                    Alertes de Connexion Email
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    Recevoir un email en cas de connexion suspecte
                  </Text>
                </View>
                <Switch
                  value={loginAlertsEnabled}
                  onValueChange={setLoginAlertsEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#0057FF" }}
                  thumbColor="#ffffff"
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <View className="flex-1 pr-4">
                  <Text className="font-bold text-[16px] text-zeno-text-primary">
                    Validation SMS pour les virements
                  </Text>
                  <Text className="text-[13px] text-gray-500">
                    Exiger un code SMS pour les retraits importants
                  </Text>
                </View>
                <Switch
                  value={smsAuthEnabled}
                  onValueChange={setSmsAuthEnabled}
                  trackColor={{ false: "#E5E7EB", true: "#0057FF" }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>

            {/* Action to revoke sessions */}
            <Pressable
              onPress={handleRevokeOtherSessions}
              className="mt-6 mb-4 h-14 items-center justify-center rounded-2xl bg-red-50 border border-red-200"
            >
              <Text className="font-bold text-[16px] text-red-600">
                Déconnecter les autres appareils
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}



