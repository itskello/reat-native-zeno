import { Chevron } from "@/components/ui/Chevron";
import { CountrySheet } from "@/components/ui/CountrySheet";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { LockIcon } from "@/components/ui/LockIcon";
import { images } from "@/constants/images";
import {
  SupportedCountry,
  formatPhoneNumber,
  supportedCountries,
} from "@/data/countries";
import { useSocialSignIn } from "@/lib/use-social-sign-in";
import { useStartSignUp } from "@/lib/use-start-sign-up";
import { useOnboardingStore } from "@/store/onboarding-store";
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

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const residencyCountry = useOnboardingStore((state) => state.residencyCountry);
  const phoneCountry =
    useOnboardingStore((state) => state.phoneCountry) ??
    residencyCountry ??
    supportedCountries[0];
  const setPhoneCountry = useOnboardingStore((state) => state.setPhoneCountry);
  const setAccountDetails = useOnboardingStore(
    (state) => state.setAccountDetails
  );
  const setSignUpMethod = useOnboardingStore((state) => state.setSignUpMethod);

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const {
    signInWith,
    pendingProvider,
    error: socialError,
  } = useSocialSignIn();
  const { startSignUp, isSubmitting, error: signUpError } = useStartSignUp();

  const validation = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, "");

    return {
      email: EMAIL_PATTERN.test(email.trim()),
      phone: digits.length === phoneCountry.nationalNumberLength,
      password:
        password.length >= 9 && /[a-zA-Z]/.test(password) && /\d/.test(password),
      confirmPassword: confirmPassword.length > 0 && confirmPassword === password,
    };
  }, [email, phoneNumber, password, confirmPassword, phoneCountry]);

  const isFormValid =
    validation.email &&
    validation.phone &&
    validation.password &&
    validation.confirmPassword;

  const handleSelectPhoneCountry = (country: SupportedCountry) => {
    setPhoneCountry(country);
    setPhoneNumber("");
    setIsCountrySheetOpen(false);
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text, phoneCountry.phoneFormat));
  };

  const phonePlaceholder = phoneCountry.phoneFormat.replace(/#/g, "0");

  const handleContinue = async () => {
    if (!isFormValid) {
      return;
    }

    setAccountDetails({ email: email.trim(), phoneNumber });
    setSignUpMethod("form");

    const started = await startSignUp({
      email: email.trim(),
      phoneNumber,
      password,
      country: phoneCountry,
    });

    if (started) {
      router.push("/verify-phone");
    }
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
            Create Account
          </Text>
          <Text
            className="mt-3 font-medium text-[19px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Let&apos;s Get You Started
          </Text>

          <Pressable
            className="mt-7 h-[64px] flex-row items-center rounded-[22px] bg-white px-6 shadow-card"
            onPress={() => {
              setSignUpMethod("google");
              signInWith("oauth_google");
            }}
            disabled={pendingProvider !== null}
            style={({ pressed }) => ({
              opacity: pressed || pendingProvider !== null ? 0.6 : 1,
            })}
          >
            <Image
              source={images.google}
              style={{ width: 34, height: 34 }}
              contentFit="contain"
            />
            <Text
              className="flex-1 text-center font-medium text-[18px] text-[#252525]"
              allowFontScaling={false}
            >
              {pendingProvider === "oauth_google"
                ? "Signing In…"
                : "Login With Google"}
            </Text>
          </Pressable>

          {socialError ? (
            <Text
              className="mt-3 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {socialError}
            </Text>
          ) : null}

          <View className="mt-6 flex-row items-center">
            <View className="h-[1px] flex-1 bg-[#C9C9C9]" />
            <Text
              className="mx-3 font-medium text-[16px] text-[#3C3C3C]"
              allowFontScaling={false}
            >
              OR
            </Text>
            <View className="h-[1px] flex-1 bg-[#C9C9C9]" />
          </View>

          <Text
            className="mt-6 font-medium text-[16px] text-[#252525]"
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
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
          </View>

          <Text
            className="mt-7 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Phone number
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <Pressable
              className="flex-row items-center"
              onPress={() => setIsCountrySheetOpen(true)}
              hitSlop={8}
            >
              <Image
                source={phoneCountry.flag}
                style={{ width: 30, height: 30, borderRadius: 15 }}
                contentFit="cover"
              />
              <Text
                className="ml-3 font-bold text-[17px] text-[#161616]"
                allowFontScaling={false}
              >
                {phoneCountry.dialCode}
              </Text>
              <View className="ml-2">
                <Chevron direction="down" size={9} color="#6B6B6B" />
              </View>
            </Pressable>
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder={phonePlaceholder}
              placeholderTextColor="#B4B4B4"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={phoneCountry.phoneFormat.length}
              allowFontScaling={false}
            />
          </View>

          <Text
            className="mt-7 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Password
          </Text>
          <Text
            className="mt-2 font-normal text-[15px] leading-[22px] text-[#3C3C3C]"
            allowFontScaling={false}
          >
            Your password must be at least{" "}
            <Text className="font-bold">9 characters,</Text> containing{" "}
            <Text className="font-bold">a letter</Text> and{" "}
            <Text className="font-bold">a number</Text>
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <LockIcon size={24} />
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder="********"
              placeholderTextColor="#9A9A9A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
            <Pressable
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              hitSlop={12}
            >
              <EyeIcon size={28} crossed={isPasswordVisible} />
            </Pressable>
          </View>

          <Text
            className="mt-7 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Re-type the Password
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <LockIcon size={24} />
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder="********"
              placeholderTextColor="#9A9A9A"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!isConfirmVisible}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
            <Pressable
              onPress={() => setIsConfirmVisible((visible) => !visible)}
              hitSlop={12}
            >
              <EyeIcon size={28} crossed={isConfirmVisible} />
            </Pressable>
          </View>

          {confirmPassword.length > 0 && !validation.confirmPassword ? (
            <Text
              className="mt-3 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              Passwords do not match
            </Text>
          ) : null}
        </ScrollView>

        <View className="px-6 pb-4 pt-2">
          {signUpError ? (
            <Text
              className="mb-3 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {signUpError}
            </Text>
          ) : null}

          <Pressable
            className={`h-[64px] items-center justify-center rounded-full ${
              isFormValid ? "bg-zeno-green" : "bg-[#D3D3D3]"
            }`}
            disabled={!isFormValid || isSubmitting}
            onPress={handleContinue}
          >
            <Text
              className={`font-bold text-[20px] ${
                isFormValid ? "text-zeno-dark" : "text-[#ADADAD]"
              }`}
              allowFontScaling={false}
            >
              {isSubmitting ? "Sending Code…" : "Continue"}
            </Text>
          </Pressable>
        </View>
      </View>

      <CountrySheet
        visible={isCountrySheetOpen}
        onClose={() => setIsCountrySheetOpen(false)}
        onSelect={handleSelectPhoneCountry}
        includeTestCountries
      />
    </KeyboardAvoidingView>
  );
}
