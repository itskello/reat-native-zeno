import { MailIcon } from "@/components/ui/MailIcon";
import { images } from "@/constants/images";
import { usePasswordReset } from "@/lib/use-password-reset";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { sendResetCode, isSubmitting, error, setError } = usePasswordReset();

  const isFormValid = useMemo(() => EMAIL_PATTERN.test(email.trim()), [email]);

  const handleSend = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }

    const ok = await sendResetCode(email);
    if (!ok) {
      return;
    }

    // Reveal the confirmation card, then move on so the user reads it briefly.
    setSent(true);
    setTimeout(() => {
      router.push({
        pathname: "/verify-reset-code",
        params: { email: email.trim() },
      });
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        className="flex-1 bg-zeno-auth-background"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ScrollView
          contentContainerClassName="flex-grow px-6 pt-4 pb-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            className="mt-11 font-bold text-[38px] leading-[44px] text-black"
            allowFontScaling={false}
          >
            Forgot Password
          </Text>
          <Text
            className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            No worries, we&apos;ll help you reset it
          </Text>

          <Text
            className="mt-[72px] font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Email address
          </Text>
          <View className="mt-3 h-[64px] justify-center rounded-[22px] bg-white px-6 shadow-card">
            <TextInput
              className="font-bold text-[17px] text-[#161616]"
              placeholder="johndoe@gmail.com"
              placeholderTextColor="#B4B4B4"
              value={email}
              onChangeText={(next) => {
                setError(null);
                setEmail(next);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
          </View>

          {error ? (
            <Text
              className="mt-4 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            className={`mt-6 h-[64px] items-center justify-center rounded-full ${
              isFormValid && !isSubmitting ? "bg-zeno-green" : "bg-[#D3D3D3]"
            }`}
            disabled={!isFormValid || isSubmitting}
            onPress={handleSend}
          >
            <Text
              className={`font-bold text-[22px] ${
                isFormValid && !isSubmitting ? "text-zeno-dark" : "text-[#ADADAD]"
              }`}
              allowFontScaling={false}
            >
              {isSubmitting ? "Sending…" : "Send Reset Code"}
            </Text>
          </Pressable>

          {sent ? (
            <View className="mt-[90px] flex-row items-start rounded-[22px] bg-zeno-blue-light p-5">
              <View className="h-[54px] w-[54px] items-center justify-center rounded-full bg-zeno-blue">
                <MailIcon size={28} color="#FFFFFF" />
              </View>
              <View className="ml-4 flex-1">
                <Text
                  className="font-semibold text-[19px] leading-[26px] text-[#1F2937]"
                  allowFontScaling={false}
                >
                  We&apos;ve sent a reset code to your email.
                </Text>
                <Text
                  className="mt-4 font-medium text-[17px] leading-[24px] text-[#374151]"
                  allowFontScaling={false}
                >
                  Enter it on the next screen to reset your password.
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
