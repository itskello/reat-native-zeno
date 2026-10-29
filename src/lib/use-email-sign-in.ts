import { getClerkErrorMessage } from "@/lib/clerk-error";
import { useSignIn } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Email + password sign-in for existing users.
 *
 * Sign-in is email-only on purpose: Clerk only knows the email address. A ZENO
 * phone number lives in the user's metadata (verified through our own backend
 * because Clerk's SMS does not reach our markets), so it is not a Clerk
 * identifier and cannot be used to sign in without a dedicated lookup endpoint.
 *
 * MFA handling:
 * When Clerk returns `needs_second_factor` (email_code strategy), we store the
 * signIn object in memory and navigate to a dedicated verification screen so the
 * user can enter the one-time code sent to their email.
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

        // ── MFA: Clerk requires a second factor (email OTP) ──────────────────
        if (attempt.status === "needs_second_factor") {
          const emailFactor = attempt.supportedSecondFactors?.find(
            (f: any) => f.strategy === "email_code"
          );

          if (emailFactor) {
            // Ask Clerk to send the OTP email
            await signIn.prepareSecondFactor({
              strategy: "email_code",
              emailAddressId: emailFactor.emailAddressId,
            });

            // Navigate to the MFA verification screen
            router.push("/verify-mfa");
            return false; // Not yet complete — MFA screen takes over
          }
        }

        // Any other unhandled status — log for debugging
        console.warn("[clerk] sign-in not complete", {
          status: attempt.status,
          supportedSecondFactors: attempt.supportedSecondFactors,
        });

        setError("Additional verification is required. Please contact support.");
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
