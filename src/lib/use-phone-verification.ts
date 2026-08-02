import { requestPhoneOtp, verifyPhoneOtp } from "@/lib/api";
import { toE164 } from "@/lib/phone";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useCallback, useState } from "react";

/**
 * Phone verification runs against ZENO's own backend, not Clerk.
 *
 * Clerk's managed SMS does not deliver to our launch markets (Benin, Côte
 * d'Ivoire, Togo), so the phone OTP is issued and checked by /api/otp/* using a
 * regional SMS provider. Clerk still owns the account, email, password, Google
 * sign-in and session — only the phone number's proof-of-control lives here.
 *
 * The plain code is never on the device: the backend returns a signed token
 * that we replay at verify time.
 */
export function usePhoneVerification() {
  const phoneCountry = useOnboardingStore((state) => state.phoneCountry);
  const phoneNumber = useOnboardingStore((state) => state.phoneNumber);
  const token = useOnboardingStore((state) => state.phoneOtpToken);
  const setPhoneOtpToken = useOnboardingStore((state) => state.setPhoneOtpToken);

  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const e164 =
    phoneCountry && phoneNumber ? toE164(phoneCountry.dialCode, phoneNumber) : "";

  const verifyCode = useCallback(
    async (code: string) => {
      if (!e164 || !token) {
        setError("Verification is not ready yet. Please request a new code.");
        return false;
      }

      setIsVerifying(true);
      setError(null);

      const result = await verifyPhoneOtp({ phone: e164, token, code });
      setIsVerifying(false);

      if (result.ok) {
        return true;
      }

      setError(result.error);
      return false;
    },
    [e164, token]
  );

  const resendCode = useCallback(async () => {
    if (!e164) {
      setError("We do not have a phone number to send a code to.");
      return false;
    }

    setError(null);

    const result = await requestPhoneOtp(e164);

    if (result.ok) {
      setPhoneOtpToken(result.data.token);
      return true;
    }

    setError(result.error);
    return false;
  }, [e164, setPhoneOtpToken]);

  return { verifyCode, resendCode, isVerifying, error, setError };
}
