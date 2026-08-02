import { VerifyCodeScreen } from "@/components/auth/VerifyCodeScreen";
import { toE164 } from "@/lib/phone";
import { usePhoneVerification } from "@/lib/use-phone-verification";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useSignUp, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback } from "react";

export default function VerifyPhoneScreen() {
  const { signUp } = useSignUp();
  const { user, isSignedIn } = useUser();
  const phoneCountry = useOnboardingStore((state) => state.phoneCountry);
  const phoneNumber = useOnboardingStore((state) => state.phoneNumber);
  const signUpMethod = useOnboardingStore((state) => state.signUpMethod);
  const { verifyCode, resendCode, isVerifying, error, setError } =
    usePhoneVerification();

  const displayNumber = [phoneCountry?.dialCode, phoneNumber]
    .filter(Boolean)
    .join(" ");

  // Record that our backend confirmed the number, now that the code checked out.
  const handleVerified = useCallback(async () => {
    if (phoneCountry && phoneNumber) {
      const e164 = toE164(phoneCountry.dialCode, phoneNumber);
      try {
        // A Google sign-up already has an active session (a Clerk user), so the
        // number is written onto the user. A form sign-up is still a signUp
        // attempt, so it is written onto signUp.unsafeMetadata instead.
        if (isSignedIn && user) {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              phoneNumber: e164,
              phoneVerified: true,
            },
          });
        } else if (signUp) {
          await signUp.update({
            unsafeMetadata: { phoneNumber: e164, phoneVerified: true },
          });
        }
      } catch {
        // Non-blocking: the number is still verified, only the flag lagged.
      }
    }

    // Skip email verification when the email is already proven. This is the
    // robust signal — the in-memory signUpMethod flag is lost across the OAuth
    // browser round-trip, but the Clerk session survives it. A Google sign-up
    // returns with an active session whose email Clerk already verified; a form
    // sign-up has no session yet and must verify its email.
    const emailAlreadyVerified =
      isSignedIn &&
      user?.primaryEmailAddress?.verification?.status === "verified";

    if (emailAlreadyVerified || signUpMethod === "google") {
      router.replace("/create-pin");
    } else {
      router.replace("/verify-email");
    }
  }, [signUp, user, isSignedIn, phoneCountry, phoneNumber, signUpMethod]);

  return (
    <VerifyCodeScreen
      title="Verify Phone Number"
      sentTo={displayNumber}
      onVerify={verifyCode}
      onResend={resendCode}
      onVerified={handleVerified}
      isVerifying={isVerifying}
      error={error}
      onCodeChange={() => setError(null)}
    />
  );
}
