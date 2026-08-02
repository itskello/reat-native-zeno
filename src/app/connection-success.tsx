import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Connection Successful — login convergence and preloading screen.
 *
 * Shown right after a returning user unlocks with their PIN at login
 * (email/password OR Google). Unlike onboarding-complete, this is NOT the
 * end of onboarding — it's the transition after a successful sign-in. It
 * reuses the same dark ZENO logo visual so the "wallet is loading in the
 * background" feel is consistent across both flows.
 *
 * While displaying the logo, this screen preloads everything needed for
 * Wallet Home in the background:
 * - Session state verification
 * - Wallet balance fetch
 * - Initial transactions
 * - User profile data
 *
 * Once loading completes (or after a minimum display duration of ~1.5s,
 * whichever is longer), it automatically navigates to Wallet Home (/wallet).
 *
 * No user interaction, no buttons, no back navigation.
 */
export default function ConnectionSuccessScreen() {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeWallet = async () => {
      const startTime = Date.now();

      try {
        // TODO: Replace with actual wallet initialization logic
        // - Verify session state with Clerk
        // - Fetch wallet balance from backend
        // - Load initial transaction history
        // - Load user profile data
        // - Initialize any required app state

        // Simulate preloading for now (remove this when real API calls are added)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Ensure minimum display duration of 1.5 seconds for visual consistency
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1500 - elapsed);

        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (isMounted) {
          setIsReady(true);
        }
      } catch (error) {
        // TODO: Handle initialization errors gracefully
        // - Show a minimal error state
        // - Offer retry option
        // - Don't navigate to a broken Wallet Home
        console.error("Wallet initialization failed:", error);

        // For now, proceed anyway after minimum duration
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 1500 - elapsed);

        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        if (isMounted) {
          setIsReady(true);
        }
      }
    };

    initializeWallet();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) {
      // Navigate to Wallet Home. Note: the root route "/" is the intro splash
      // (it redirects to /welcome), so Wallet Home lives at the "/wallet" route.
      router.replace("/wallet");
    }
  }, [isReady]);

  return (
    <View
      className="flex-1 items-center justify-center bg-zeno-dark"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Image
        source={images.logoGreenLight}
        style={{ width: 200, height: 200 }}
        contentFit="contain"
      />
    </View>
  );
}
