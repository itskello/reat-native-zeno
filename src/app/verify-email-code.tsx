import { VerifyCodeScreen } from "@/components/auth/VerifyCodeScreen";
import { useEmailVerification } from "@/lib/use-email-verification";
import { useOnboardingStore } from "@/store/onboarding-store";
import { router } from "expo-router";
import { useCallback } from "react";

export default function VerifyEmailCodeScreen() {
  const email = useOnboardingStore((state) => state.email);
  const { sendCode, verifyCode, isVerifying, error, setError } =
    useEmailVerification();

  const handleVerified = useCallback(() => {
    router.replace("/create-pin");
  }, []);

  return (
    <VerifyCodeScreen
      title="Verify Email"
      sentTo={email}
      onVerify={verifyCode}
      onResend={sendCode}
      onVerified={handleVerified}
      isVerifying={isVerifying}
      error={error}
      onCodeChange={() => setError(null)}
    />
  );
}
