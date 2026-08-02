import { SupportedCountry } from "@/data/countries";
import { requestPhoneOtp } from "@/lib/api";
import { getClerkErrorMessage } from "@/lib/clerk-error";
import { toE164 } from "@/lib/phone";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useSignUp } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

type StartSignUpInput = {
  email: string;
  phoneNumber: string;
  password: string;
  country: SupportedCountry;
};

/**
 * Starts sign-up in two parts, because the phone lives outside Clerk:
 *
 *  1. Clerk creates the account from email + password. The verified E.164 number
 *     is stashed in `unsafeMetadata` so it is on the user from the start; it is
 *     marked verified only once our own OTP check passes.
 *  2. ZENO's backend sends the phone code via a regional SMS provider that
 *     actually delivers to Benin, Côte d'Ivoire and Togo.
 *
 * The password is handed straight to Clerk and never persisted on the device.
 */
export function useStartSignUp() {
  const { signUp, isLoaded } = useSignUp();
  const setPhoneOtpToken = useOnboardingStore((state) => state.setPhoneOtpToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSignUp = useCallback(
    async ({ email, phoneNumber, password, country }: StartSignUpInput) => {
      if (!isLoaded || !signUp) {
        setError("Sign-up is not ready yet. Please try again.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      const e164 = toE164(country.dialCode, phoneNumber);

      try {
        // No phoneNumber here: giving it to Clerk would demand Clerk's own SMS
        // verification, which does not reach our markets.
        await signUp.create({
          emailAddress: email,
          password,
          unsafeMetadata: { phoneNumber: e164, phoneVerified: false },
        });
      } catch (cause) {
        setIsSubmitting(false);
        setError(
          getClerkErrorMessage(
            cause,
            "We could not create your account. Please try again."
          )
        );
        return false;
      }

      const sent = await requestPhoneOtp(e164);
      setIsSubmitting(false);

      if (!sent.ok) {
        setError(sent.error);
        return false;
      }

      setPhoneOtpToken(sent.data.token);
      return true;
    },
    [isLoaded, signUp, setPhoneOtpToken]
  );

  return { startSignUp, isSubmitting, error };
}
