import { VerifyCodeScreen } from "@/components/auth/VerifyCodeScreen";
import { toE164 } from "@/lib/phone";
import { usePhoneVerification } from "@/lib/use-phone-verification";
import { useOnboardingStore } from "@/store/onboarding-store";
import { useSignUp } from "@clerk/expo/legacy";
import { useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useCallback } from "react";

export default function VerifyPhoneScreen() {
  const { signUp } = useSignUp();
  const { user, isSignedIn } = useUser();
  const phoneCountry = useOnboardingStore((state) => state.phoneCountry);
  const residencyCountry = useOnboardingStore((state) => state.residencyCountry);
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
              countryId: residencyCountry?.id ?? phoneCountry.id,
            },
          });
        } else if (signUp) {
          await signUp.update({
            unsafeMetadata: {
              ...signUp.unsafeMetadata,
              phoneNumber: e164,
              phoneVerified: true,
              countryId: residencyCountry?.id ?? phoneCountry.id,
            },
          });
        }
      } catch {
        // Non-blocking: the number is still verified, only the flag lagged.
      }
    }

    // Skip email verification when the Clerk session is already active or
    // when the flow originated from Google. This prevents unnecessary email
    // verification screens for Google accounts, especially across the OAuth
    // browser round-trip.
    const emailAlreadyVerified =
      isSignedIn &&
      user?.primaryEmailAddress?.verification?.status === "verified";

    const skipEmailVerification =
      emailAlreadyVerified ||
      signUpMethod === "google" ||
      (isSignedIn && !!user?.primaryEmailAddress?.emailAddress);

    console.warn("[clerk] verify-phone skipEmailVerification", {
      emailAlreadyVerified,
      signUpMethod,
      isSignedIn,
      email: user?.primaryEmailAddress?.emailAddress,
      skipEmailVerification,
    });

    if (skipEmailVerification) {
      router.replace("/create-pin");
    } else {
      router.replace("/verify-email");
    }
  }, [signUp, user, isSignedIn, phoneCountry, phoneNumber, residencyCountry, signUpMethod]);

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
