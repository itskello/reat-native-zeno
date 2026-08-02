import { getClerkErrorMessage } from "@/lib/clerk-error";
import { useSignIn } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

/**
 * Email + password sign-in for existing users.
 *
 * Sign-in is email-only on purpose: Clerk only knows the email address. A ZENO
 * phone number lives in the user's metadata (verified through our own backend
 * because Clerk's SMS does not reach our markets), so it is not a Clerk
 * identifier and cannot be used to sign in without a dedicated lookup endpoint.
 */
export function useEmailSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!isLoaded || !signIn) {
        setError("Sign-in is not ready yet. Please try again.");
        return false;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const attempt = await signIn.create({
          identifier: email.trim(),
          password,
        });

        if (attempt.status === "complete") {
          await setActive({ session: attempt.createdSessionId });
          return true;
        }

        // Any other status means Clerk wants another step we do not collect here
        // — most often a second factor (MFA) enabled in the dashboard, or the
        // account's email is still unverified. Log exactly what Clerk expects so
        // the cause is unambiguous instead of a generic message.
        console.warn("[clerk] sign-in not complete", {
          status: attempt.status,
          supportedFirstFactors: attempt.supportedFirstFactors,
          supportedSecondFactors: attempt.supportedSecondFactors,
        });

        setError("Additional verification is required to sign in.");
        return false;
      } catch (cause) {
        setError(
          getClerkErrorMessage(
            cause,
            "We could not sign you in. Check your details and try again."
          )
        );
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [isLoaded, signIn, setActive]
  );

  return { signInWithPassword, isSubmitting, error, setError };
}
