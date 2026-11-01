import { useOnboardingStore } from "@/store/onboarding-store";
import { useSSO } from "@clerk/expo";
import { useSignInWithGoogle } from "@clerk/expo/google";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Platform } from "react-native";
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
  const { startGoogleAuthenticationFlow } = useSignInWithGoogle();
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
        const result = strategy === "oauth_google" && Platform.OS !== "web"
          ? await startGoogleAuthenticationFlow()
          : await startSSOFlow({
              strategy,
              redirectUrl: Linking.createURL("/"),
            });

        const { createdSessionId, setActive, signIn, signUp } = result;

        if (!createdSessionId || !setActive) {
          setPendingProvider(null);
          return;
        }

        await setActive({ session: createdSessionId });

        if (signIn && signIn.status === "complete") {
          router.replace("/verify-pin");
        } else if (!signUp) {
          router.replace("/verify-pin");
        } else {
          setSignUpMethod("google");
          router.replace("/add-phone-number");
        }
      } catch (err) {
        const code = typeof err === "object" && err !== null && "code" in err
          ? String(err.code)
          : "";
        if (code !== "SIGN_IN_CANCELLED" && code !== "-5") {
          setError("Sign-in failed. Please try again.");
        }
        setPendingProvider(null);
      }
    },
    [pendingProvider, startSSOFlow, startGoogleAuthenticationFlow, setSignUpMethod]
  );

  return { signInWith, pendingProvider, error };
}
