import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Screen 3: Fingerprint Success.
 *
 * This screen confirms successful biometric enrollment. No back button — the
 * user has already completed enrollment and can only proceed forward to the
 * Onboarding Complete screen.
 *
 * Flow:
 * - "Done" → navigate to onboarding-complete (preloading screen before Wallet)
 */
export default function FingerprintSuccessScreen() {
  const insets = useSafeAreaInsets();

  const handleDone = () => {
    router.replace("/onboarding-complete");
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="mt-11 font-bold text-[38px] leading-[44px] text-black"
          allowFontScaling={false}
        >
          Fingerprint
        </Text>
        <Text
          className="mt-4 font-bold text-[19px] leading-[26px] text-black"
          allowFontScaling={false}
        >
          You&apos;re all set!
        </Text>

        <View className="mt-[72px] items-center">
          <Image
            source={images.bioValidated}
            style={{ width: 280, height: 280 }}
            contentFit="contain"
          />
        </View>

        <Text
          className="mt-[56px] text-center font-medium text-[17px] leading-[24px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          You can now access your account and pay using your fingerprint.
        </Text>

        <View className="flex-1" />

        <Pressable
          className="mt-10 h-[64px] items-center justify-center rounded-full bg-zeno-green"
          onPress={handleDone}
        >
          <Text
            className="font-bold text-[22px] text-zeno-dark"
            allowFontScaling={false}
          >
            Done
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
