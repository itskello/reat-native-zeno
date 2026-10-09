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
        const result = await startSSOFlow({
          strategy,
          redirectUrl: Linking.createURL("/"),
        });

        // Helpful debug: log the full startSSOFlow return so we can inspect
        // why callbacks sometimes fail in production (redirect URI, missing
        // fields, etc.). Remove these logs after we resolve the issue.
        console.warn("[clerk] startSSOFlow result", result);

        const { createdSessionId, setActive, signIn, signUp } = result;

        if (!createdSessionId || !setActive) {
          console.warn("[clerk] startSSOFlow returned no session", result);
          setError("Additional information is required to finish signing in.");
          setPendingProvider(null);
          return;
        }

        console.warn("[clerk] OAuth: calling setActive with session", {
          createdSessionId,
          hasSignIn: !!signIn,
          hasSignUp: !!signUp,
        });

        // Activate the session, then route based on account status.
        // We need to ensure setActive completes before routing to avoid
        // race conditions where Clerk state isn't synchronized yet.
        await setActive({ session: createdSessionId });

        // After setActive, the session should be active. Decide where to route
        // based on whether this is an existing account (signIn complete) or new.
        if (signIn && signIn.status === "complete") {
          console.warn("[clerk] OAuth: existing account, routing to /verify-pin");
          router.replace("/verify-pin");
        } else if (!signUp) {
          console.warn("[clerk] OAuth: no signUp object, routing to /verify-pin");
          router.replace("/verify-pin");
        } else {
          console.warn("[clerk] OAuth: new account, routing to /add-phone-number");
          setSignUpMethod("google");
          router.replace("/add-phone-number");
        }
      } catch (err) {
        console.warn("[clerk] OAuth error", err);
        setError("Sign-in failed. Please try again.");
        setPendingProvider(null);
      }
    },
    [pendingProvider, startSSOFlow, setSignUpMethod]
  );

  return { signInWith, pendingProvider, error };
}
