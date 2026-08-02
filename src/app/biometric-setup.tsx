import { images } from "@/constants/images";
import { useSecurityStore } from "@/store/security-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Screen 1: Biometric Set Up (generic consent).
 *
 * This is the entry point to the biometric enrollment flow. It explains the
 * benefits of biometric authentication without referencing a specific type
 * (Face ID / fingerprint) yet — that detection happens on the next screen.
 *
 * Flow:
 * - "Enable Biometrics" → navigate to Screen 2 (fingerprint-setup)
 * - "Maybe Later" → skip biometric setup, store preference as disabled, and
 *   navigate directly to onboarding-complete
 */
export default function BiometricSetupScreen() {
  const insets = useSafeAreaInsets();
  const setBiometricEnabled = useSecurityStore(
    (state) => state.setBiometricEnabled
  );

  const handleEnableBiometrics = () => {
    router.push("/fingerprint-setup");
  };

  const handleSkip = async () => {
    // Store the explicit skip preference so the app won't ask again.
    await setBiometricEnabled(false);
    router.replace("/onboarding-complete");
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-4 pb-6">
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
          className="mt-11 font-bold text-[38px] leading-[44px] text-black"
          allowFontScaling={false}
        >
          Biometric Set Up
        </Text>
        <Text
          className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Use biometrics to login and authorize transaction
        </Text>

        <View className="mt-12 items-center">
          <Image
            source={images.bioSetupPadlock}
            style={{ width: 180, height: 180 }}
            contentFit="contain"
          />
        </View>

        <View className="mt-10 gap-y-4">
          <Text
            className="font-bold text-[18px] text-black"
            allowFontScaling={false}
          >
            Faster login
          </Text>
          <Text
            className="font-bold text-[18px] text-black"
            allowFontScaling={false}
          >
            More secure
          </Text>
          <Text
            className="font-bold text-[18px] text-black"
            allowFontScaling={false}
          >
            Easy payments approval
          </Text>
        </View>

        <View className="flex-1" />

        <Pressable
          className="h-[64px] items-center justify-center rounded-full bg-zeno-green"
          onPress={handleEnableBiometrics}
        >
          <Text
            className="font-bold text-[22px] text-zeno-dark"
            allowFontScaling={false}
          >
            Enable Biometrics
          </Text>
        </Pressable>

        <Pressable
          className="mt-5 items-center py-3"
          onPress={handleSkip}
          hitSlop={8}
        >
          <Text
            className="font-bold text-[17px] text-zeno-link-blue"
            allowFontScaling={false}
          >
            Maybe Later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
