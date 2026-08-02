import { getClerkErrorMessage } from "@/lib/clerk-error";
import { useSignUp } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

/**
 * Clerk's email verification, mirroring the phone flow. The code is only ever
 * checked by Clerk — nothing about it is validated or stored on the device.
 */
export function useEmailVerification() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = useCallback(async () => {
    if (!isLoaded || !signUp) {
      setError("Verification is not ready yet. Please try again.");
      return false;
    }

    setError(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      return true;
    } catch (cause) {
      setError(
        getClerkErrorMessage(
          cause,
          "We could not send the code. Please try again."
        )
      );
      return false;
    }
  }, [isLoaded, signUp]);

  const verifyCode = useCallback(
    async (code: string) => {
      if (!isLoaded || !signUp) {
        setError("Verification is not ready yet. Please try again.");
        return false;
      }

      setIsVerifying(true);
      setError(null);

      try {
        const attempt = await signUp.attemptEmailAddressVerification({ code });

        if (attempt.status === "complete") {
          await setActive({ session: attempt.createdSessionId });
          return true;
        }

        // The email is verified, but Clerk still won't create the user: some
        // required field is missing. This is almost always a dashboard config
        // mismatch — e.g. "Phone number" left ON as a required identifier while
        // ZENO deliberately keeps the phone outside Clerk (in unsafeMetadata).
        // Surface exactly what Clerk is still waiting on so it can be fixed.
        console.warn("[clerk] sign-up not complete after email verification", {
          status: attempt.status,
          missingFields: attempt.missingFields,
          unverifiedFields: attempt.unverifiedFields,
          requiredFields: attempt.requiredFields,
        });

        setError(
          "Your email is verified, but the account could not be finalized. " +
            "Please try again or contact support."
        );
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
        setIsVerifying(false);
      }
    },
    [isLoaded, signUp, setActive]
  );

  return { sendCode, verifyCode, isVerifying, error, setError };
}
