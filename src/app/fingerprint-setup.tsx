import { images } from "@/constants/images";
import { authenticateWithBiometrics } from "@/lib/biometrics";
import { useSecurityStore } from "@/store/security-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Screen 2: Fingerprint (enrollment).
 *
 * This screen triggers the native biometric authentication prompt. On success,
 * the preference is stored and the user proceeds to the success screen. On
 * failure or skip, the user can retry or navigate to onboarding-complete.
 *
 * Flow:
 * - "Set Up Fingerprint" → trigger native biometric prompt
 *   - Success → store preference as enabled, navigate to fingerprint-success
 *   - Failure/cancelled → show inline error, allow retry or skip
 * - "Maybe Later" → skip biometric setup, store preference as disabled, and
 *   navigate to onboarding-complete
 */
export default function FingerprintSetupScreen() {
  const insets = useSafeAreaInsets();
  const setBiometricEnabled = useSecurityStore(
    (state) => state.setBiometricEnabled
  );
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetUpFingerprint = async () => {
    setIsEnrolling(true);
    setError(null);

    const result = await authenticateWithBiometrics(
      "Set up biometric authentication for ZENO"
    );

    setIsEnrolling(false);

    if (result.success) {
      // Store the preference and proceed to the success screen.
      await setBiometricEnabled(true);
      router.replace("/fingerprint-success");
      return;
    }

    // Show an appropriate error message based on the failure reason.
    if (result.reason === "unavailable") {
      setError(
        "Biometric authentication is not available on this device. Make sure you have enrolled a fingerprint or Face ID in your device settings."
      );
    } else if (result.reason === "cancelled") {
      // User cancelled — no error, just allow them to retry or skip.
      setError(null);
    } else {
      setError(
        "Biometric authentication failed. Please try again or tap Maybe Later to skip."
      );
    }
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
          Fingerprint
        </Text>
        <Text
          className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Strengthen security with your fingerprint
        </Text>

        <View className="mt-12 items-center">
          <Image
            source={images.bioSetupFingerprint}
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

        {error ? (
          <Text
            className="mt-6 font-medium text-[15px] text-zeno-error"
            allowFontScaling={false}
          >
            {error}
          </Text>
        ) : null}

        <View className="flex-1" />

        <Pressable
          className={`h-[64px] items-center justify-center rounded-full ${
            isEnrolling ? "bg-[#D3D3D3]" : "bg-zeno-green"
          }`}
          onPress={handleSetUpFingerprint}
          disabled={isEnrolling}
        >
          <Text
            className={`font-bold text-[22px] ${
              isEnrolling ? "text-[#ADADAD]" : "text-zeno-dark"
            }`}
            allowFontScaling={false}
          >
            {isEnrolling ? "Setting Up..." : "Set Up Fingerprint"}
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
