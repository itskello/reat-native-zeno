import { VerifyCodeScreen } from "@/components/auth/VerifyCodeScreen";
import { getClerkErrorMessage } from "@/lib/clerk-error";
import { useSignIn } from "@clerk/expo/legacy";
import { router } from "expo-router";
import { useCallback, useState } from "react";

/**
 * MFA second-factor screen.
 *
 * Reached after email+password sign-in when Clerk returns `needs_second_factor`
 * with the `email_code` strategy. The user enters the OTP sent to their email
 * to complete the sign-in flow.
 */
export default function VerifyMfaScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!isLoaded || !signIn) return false;

      setIsVerifying(true);
      setError(null);

      try {
        const attempt = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code,
        });

        if (attempt.status === "complete") {
          await setActive({ session: attempt.createdSessionId });
          // Session active — route to PIN unlock (same as normal sign-in)
          router.replace("/verify-pin");
          return true;
        } else {
          setError("Verification incomplete. Please try again.");
          return false;
        }
      } catch (cause) {
        setError(
          getClerkErrorMessage(cause, "Invalid code. Please check and try again.")
        );
        return false;
      } finally {
        setIsVerifying(false);
      }
    },
    [isLoaded, signIn, setActive]
  );

  const handleResend = useCallback(async () => {
    if (!isLoaded || !signIn) return false;
    try {
      // Re-prepare the email_code factor to resend the OTP
      const emailFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === "email_code"
      );
      if (!emailFactor) return false;
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      return true;
    } catch {
      // Silent — user sees the resend button state
      return false;
    }
  }, [isLoaded, signIn]);

  // Get the safe email identifier Clerk shows (e.g. "it***@gmail.com")
  const safeEmail =
    (signIn?.supportedSecondFactors?.[0] as any)?.safeIdentifier ?? "your email";

  return (
    <VerifyCodeScreen
      title="Two-Factor Verification"
      sentTo={safeEmail}
      onVerify={handleVerify}
      onResend={handleResend}
      onVerified={() => {}} // navigation handled inside handleVerify
      isVerifying={isVerifying}
      error={error}
      onCodeChange={() => setError(null)}
    />
  );
}
