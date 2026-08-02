import { useOnboardingStore } from "@/store/onboarding-store";
import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { useWarmUpBrowser } from "./warm-up-browser";

export type SSOProvider = "oauth_google" | "oauth_apple";

/**
 * Social sign-in through Clerk. Clerk owns the token exchange, so no provider
 * client secret ever reaches the device.
 */
export function useSocialSignIn() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const setSignUpMethod = useOnboardingStore((state) => state.setSignUpMethod);
  const [pendingProvider, setPendingProvider] = useState<SSOProvider | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const signInWith = useCallback(
    async (strategy: SSOProvider) => {
      if (pendingProvider) {
        return;
      }

      setPendingProvider(strategy);
      setError(null);

      try {
        const { createdSessionId, setActive, signUp } = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL("/add-phone-number"),
        });

        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });

          if (signUp) {
            // New account: Google OAuth doesn't collect phone number, so redirect
            // to Add Your Phone Number screen first (which also captures country
            // via the dial code picker). After the phone is added, the flow
            // continues to Verify Phone Number.
            setSignUpMethod("google");
            router.replace("/add-phone-number");
          } else {
            // Existing account: already onboarded. Still require the PIN unlock
            // before the wallet, exactly like email/password login.
            router.replace("/verify-pin");
          }
          return;
        }

        // No session means Clerk needs more steps (e.g. missing required fields).
        setError("Additional information is required to finish signing in.");
      } catch {
        setError("Sign-in failed. Please try again.");
      } finally {
        setPendingProvider(null);
      }
    },
    [pendingProvider, startSSOFlow, setSignUpMethod]
  );

  return { signInWith, pendingProvider, error };
}
