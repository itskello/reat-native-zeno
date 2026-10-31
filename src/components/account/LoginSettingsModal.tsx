import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { CloseIcon } from "@/components/ui/CloseIcon";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Switch, View } from "react-native";

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

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}



