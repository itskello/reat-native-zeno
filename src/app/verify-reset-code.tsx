import { VerifyCodeScreen } from "@/components/auth/VerifyCodeScreen";
import { usePasswordReset } from "@/lib/use-password-reset";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

export default function VerifyResetCodeScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { sendResetCode, verifyResetCode, isSubmitting, error, setError } =
    usePasswordReset();

  const handleVerified = useCallback(() => {
    // Clerk now expects a new password; carry the email so the next screen can
    // fall back to it if the reset resource is ever reloaded.
    router.replace({ pathname: "/reset-password", params: { email } });
  }, [email]);

  return (
    <VerifyCodeScreen
      title="Verify Reset Code"
      sentTo={email ?? ""}
      onVerify={verifyResetCode}
      onResend={() => sendResetCode(email ?? "")}
      onVerified={handleVerified}
      isVerifying={isSubmitting}
      error={error}
      onCodeChange={() => setError(null)}
    />
  );
}
