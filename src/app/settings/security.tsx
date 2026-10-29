import { LoginSettingsModal } from "@/components/account/LoginSettingsModal";
import { PinSecurityModal } from "@/components/account/PinSecurityModal";
import { UpdatePasswordModal } from "@/components/account/UpdatePasswordModal";
import { ChevronRightIcon, VerifiedBadgeIcon } from "@/components/ui/ProfileIcons";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { images } from "@/constants/images";
import { useSecurityStore } from "@/store/security-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const biometricEnabled = useSecurityStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useSecurityStore((s) => s.setBiometricEnabled);
  const loadBiometricPreference = useSecurityStore(
    (s) => s.loadBiometricPreference
  );

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [isLoginSettingsVisible, setIsLoginSettingsVisible] = useState(false);

  useEffect(() => {
    loadBiometricPreference();
  }, [loadBiometricPreference]);

  // Compute security level
  const getSecurityLevel = () => {
    let score = 1; // base: password exists (assumed)
    if (biometricEnabled) score += 1;
    // In production: check 2FA, PIN set, etc.
    score += 1; // assume PIN is set

    if (score >= 3) return { label: "Strong", color: "#70DF00" };
    if (score >= 2) return { label: "Medium", color: "#F59E0B" };
    return { label: "Weak", color: "#EF4444" };
  };

  const securityLevel = getSecurityLevel();

  const handleToggleBiometrics = async (newValue: boolean) => {
    if (newValue) {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        Alert.alert(
          "Biométrie non supportée",
          "Votre appareil ne prend pas en charge la biométrie."
        );
        return;
      }

      if (!isEnrolled) {
        Alert.alert(
          "Biométrie non configurée",
          "Veuillez enregistrer une empreinte ou votre visage dans les paramètres de votre téléphone."
        );
        return;
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authentifiez-vous pour activer la biométrie",
        fallbackLabel: "Utiliser le PIN",
      });

      if (authResult.success) {
        await setBiometricEnabled(true);
        Alert.alert("Biométrie activée", "Fingerprint / Face ID est maintenant actif sur ZENO.");
      }
    } else {
      await setBiometricEnabled(false);
      Alert.alert("Biométrie désactivée", "L'authentification biométrique a été désactivée.");
    }
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
            Security
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Security Level Top Banner */}
          <View className="flex-row items-center justify-between rounded-[28px] bg-white p-5 shadow-xs">
            <View>
              <Text
                allowFontScaling={false}
                className="font-medium text-[14px] text-zeno-text-secondary"
              >
                Security Level
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-0.5 font-bold text-[22px]"
                style={{ color: securityLevel.color }}
              >
                {securityLevel.label}
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-1 font-medium text-[14px] text-zeno-text-secondary"
              >
                {securityLevel.label === "Strong"
                  ? "Your account is well protected."
                  : securityLevel.label === "Medium"
                  ? "Consider enabling more security options."
                  : "Please improve your account security."}
              </Text>
            </View>
            <VerifiedBadgeIcon size={44} />
          </View>

          {/* Section Sub-header */}
          <Text
            allowFontScaling={false}
            className="mt-6 mb-3 font-semibold text-[18px] text-zeno-text-primary"
          >
            Security Settings
          </Text>

          {/* Security Settings Card List */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* Change Password → opens UpdatePasswordModal */}
            <Pressable
              onPress={() => setIsPasswordModalVisible(true)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Change Password
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Update your account password
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Two-Factor Authentication → opens LoginSettingsModal */}
            <Pressable
              onPress={() => setIsLoginSettingsVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Two-Factor Authentication
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Add an extra layer of security
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Biometric Login → toggles biometric */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Biometric Login
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Use fingerprint or face ID
                </Text>
              </View>
              <Switch
                value={!!biometricEnabled}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* PIN Security → opens PinSecurityModal */}
            <Pressable
              onPress={() => setIsPinModalVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  PIN Security
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Change or reset your PIN code
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Login History → informational */}
            <Pressable
              onPress={() => setIsLoginSettingsVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Login History
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  See recent login activity
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Devices → informational */}
            <Pressable
              onPress={() => setIsLoginSettingsVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Devices
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Manage trusted devices
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <UpdatePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
      />
      <PinSecurityModal
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
      />
      <LoginSettingsModal
        visible={isLoginSettingsVisible}
        onClose={() => setIsLoginSettingsVisible(false)}
      />
    </View>
  );
}

