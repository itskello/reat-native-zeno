import { getClerkErrorMessage } from "@/lib/clerk-error";
import { useSignIn } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

/**
 * Email-only password reset, built on Clerk's sign-in reset flow.
 *
 * Reset is intentionally NOT offered by phone: Clerk's SMS does not deliver to
 * ZENO's markets (Benin, Cote d'Ivoire, Togo), which is why phone verification
 * runs on our own backend. A reset code by SMS would silently never arrive, so
 * the whole flow uses the email code strategy — matching the design copy
 * ("sent to your email").
 *
 * The three steps share one Clerk `signIn` resource (held by ClerkProvider), so
 * each screen advances the same in-progress attempt:
 *   1. sendResetCode  -> creates the attempt, emails a code
 *   2. verifyResetCode -> checks the code (needs_new_password on success)
 *   3. setNewPassword  -> sets the password and signs the user in
 */
export function usePasswordReset() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendResetCode = useCallback(
    async (email: string) => {
      if (!isLoaded || !signIn) {
        setError("Password reset is not ready yet. Please try again.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email.trim(),
        });
        return true;
      } catch (cause) {
        setError(
          getClerkErrorMessage(
            cause,
            "We could not send the reset code. Please try again."
          )
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLoaded, signIn]
  );

  const verifyResetCode = useCallback(
    async (code: string) => {
      if (!isLoaded || !signIn) {
        setError("Password reset is not ready yet. Please try again.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const attempt = await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
        });

        // The code is right when Clerk now expects a new password.
        if (attempt.status === "needs_new_password") {
          return true;
        }

        setError("That code is invalid or has expired. Please try again.");
        return false;
      } catch (cause) {
        setError(
          getClerkErrorMessage(
            cause,
            "That code is invalid or has expired. Please try again."
          )
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLoaded, signIn]
  );

  const setNewPassword = useCallback(
    async (password: string) => {
      if (!isLoaded || !signIn) {
        setError("Password reset is not ready yet. Please try again.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const attempt = await signIn.resetPassword({ password });

        if (attempt.status === "complete") {
          await setActive({ session: attempt.createdSessionId });
          return true;
        }

        setError("We could not reset your password. Please try again.");
        return false;
      } catch (cause) {
        setError(
          getClerkErrorMessage(
            cause,
            "We could not reset your password. Please try again."
          )
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLoaded, signIn, setActive]
  );

  return {
    sendResetCode,
    verifyResetCode,
    setNewPassword,
    isSubmitting,
    error,
    setError,
  };
}
