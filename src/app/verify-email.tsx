import { images } from "@/constants/images";
import { useEmailVerification } from "@/lib/use-email-verification";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const email = useOnboardingStore((state) => state.email);
  const { sendCode, error } = useEmailVerification();
  const [isSending, setIsSending] = useState(false);

  const handleContinue = async () => {
    setIsSending(true);
    const sent = await sendCode();
    setIsSending(false);

    if (sent) {
      router.push("/verify-email-code");
    }
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
      >
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
          className="mt-[110px] font-bold text-[38px] leading-[44px] text-black"
          allowFontScaling={false}
        >
          Verify Email
        </Text>

        <Text
          className="mt-8 font-medium text-[19px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          The verification code will be sent to
        </Text>
        <Text
          className="mt-2 font-bold text-[21px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          {email}
        </Text>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        {error ? (
          <Text
            className="mb-3 font-medium text-[15px] text-zeno-error"
            allowFontScaling={false}
          >
            {error}
          </Text>
        ) : null}

        <Pressable
          className="h-[64px] items-center justify-center rounded-full bg-zeno-green"
          disabled={isSending}
          onPress={handleContinue}
          style={({ pressed }) => ({ opacity: pressed || isSending ? 0.7 : 1 })}
        >
          <Text
            className="font-bold text-[22px] text-zeno-dark"
            allowFontScaling={false}
          >
            {isSending ? "Sending Code…" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
