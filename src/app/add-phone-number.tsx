import { Chevron } from "@/components/ui/Chevron";
import { CountrySheet } from "@/components/ui/CountrySheet";
import { images } from "@/constants/images";
import { requestPhoneOtp } from "@/lib/api";
import {
  SupportedCountry,
  formatPhoneNumber,
  supportedCountries,
} from "@/data/countries";
import { toE164 } from "@/lib/phone";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useUser } from "@clerk/clerk-expo";
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

/**
 * Add Your Phone Number — Google OAuth flow only.
 *
 * When a user signs up via "Login With Google", Clerk creates the account
 * with email only — no phone number is collected. This screen is inserted
 * into the Google sign-up path (right after OAuth completes, before Verify
 * Phone Number) to collect the phone number that Clerk needs to send the
 * verification code to.
 *
 * The user selects their country/dial code directly on this screen, which
 * also serves as their country of residency for Google sign-ups (since they
 * skip the "Where Do You Live" screen).
 *
 * Note: Phone verification runs against ZENO's own backend (regional SMS
 * provider), not Clerk — Clerk's managed SMS does not deliver to the launch
 * markets. The E.164 number is stored in the onboarding store and written to
 * the Clerk user's unsafeMetadata once the OTP is verified (see verify-phone).
 *
 * Flow:
 * - Google sign-up: Welcome → Login With Google (OAuth) → Add Your Phone
 *   Number (this screen) → Verify Phone Number → Set Up PIN → Biometric
 *   Setup → Onboarding Complete
 */
export default function AddPhoneNumberScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [phoneCountry, setPhoneCountry] = useState<SupportedCountry>(
    supportedCountries[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setOnboardingPhone = useOnboardingStore(
    (state) => state.setAccountDetails
  );
  const setOnboardingPhoneCountry = useOnboardingStore(
    (state) => state.setPhoneCountry
  );
  const setResidencyCountry = useOnboardingStore(
    (state) => state.setResidencyCountry
  );
  const setPhoneOtpToken = useOnboardingStore((state) => state.setPhoneOtpToken);

  // Google sign-ups arrive with an active Clerk session but no email stored in
  // the onboarding store (they skip the form). Pull it from the Clerk user so
  // the store stays consistent for the rest of the onboarding flow.
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const isPhoneValid = useMemo(() => {
    const digits = phoneNumber.replace(/\D/g, "");
    return digits.length === phoneCountry.nationalNumberLength;
  }, [phoneNumber, phoneCountry]);

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
    if (!isPhoneValid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const e164 = toE164(phoneCountry.dialCode, phoneNumber);

      // Send the phone OTP via ZENO's backend (regional SMS provider that
      // delivers to Benin, Côte d'Ivoire, Togo). Clerk's managed SMS does not
      // reach our launch markets, so the number is stored in unsafeMetadata
      // and marked verified only after the OTP check passes.
      const sent = await requestPhoneOtp(e164);

      if (!sent.ok) {
        setError(sent.error);
        setIsSubmitting(false);
        return;
      }

      // Store phone details in onboarding store for the verification flow.
      // Since Google sign-ups skip "Where Do You Live", the country selected
      // here via the dial code picker also becomes the residency country.
      setOnboardingPhone({ email, phoneNumber });
      setOnboardingPhoneCountry(phoneCountry);
      setResidencyCountry(phoneCountry);
      setPhoneOtpToken(sent.data.token);

      router.push("/verify-phone");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setIsSubmitting(false);
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
            onPress={() => router.replace("/welcome")}
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
            Add Your Phone Number
          </Text>
          <Text
            className="mt-3 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            We need your phone number to verify your account and keep it secure
          </Text>

          <Text
            className="mt-10 font-medium text-[16px] text-[#252525]"
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

          {error ? (
            <Text
              className="mt-3 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {error}
            </Text>
          ) : null}
        </ScrollView>

        <View className="px-6 pb-4 pt-2">
          <Pressable
            className={`h-[64px] items-center justify-center rounded-full ${
              isPhoneValid && !isSubmitting ? "bg-zeno-green" : "bg-[#D3D3D3]"
            }`}
            disabled={!isPhoneValid || isSubmitting}
            onPress={handleContinue}
          >
            <Text
              className={`font-bold text-[20px] ${
                isPhoneValid && !isSubmitting ? "text-zeno-dark" : "text-[#ADADAD]"
              }`}
              allowFontScaling={false}
            >
              {isSubmitting ? "Adding Number…" : "Continue"}
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
