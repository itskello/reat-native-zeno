import { tokenCache } from "@/lib/token-cache";
import { DeviceSessionReporter } from "@/components/auth/DeviceSessionReporter";
import { SignOutLoadingOverlay } from "@/components/auth/SignOutLoadingOverlay";
import { useLanguageStore } from "@/store/language-store";
import { ClerkProvider } from "@clerk/expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import "../../global.css";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore splash-screen race conditions during startup
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SFProDisplay-Regular": require("../../assets/fonts/SF-Pro-Display-Regular.otf"),
    "SFProDisplay-Semibold": require("../../assets/fonts/SF-Pro-Display-Semibold.otf"),
    "SFProDisplay-Bold": require("../../assets/fonts/SF-Pro-Display-Bold.otf"),
    "SFProDisplay-Heavy": require("../../assets/fonts/SF-Pro-Display-Heavy.otf"),
    "ZalandoCondensed-Regular": require("../../assets/fonts/ZalandoSans_Condensed-Regular.ttf"),
    "ZalandoCondensed-Bold": require("../../assets/fonts/ZalandoSans_Condensed-Bold.ttf"),
  });
  const [isReady, setIsReady] = useState(false);
  const languageHydrated = useLanguageStore((state) => state.hydrated);
  const hydrateLanguage = useLanguageStore((state) => state.hydrate);

  useEffect(() => {
    void hydrateLanguage();
  }, [hydrateLanguage]);

  useEffect(() => {
    if (fontsLoaded && languageHydrated) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setIsReady(true));
    }
  }, [fontsLoaded, languageHydrated]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && languageHydrated) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, languageHydrated]);

  if (!isReady || !languageHydrated) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <DeviceSessionReporter />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 450,
          }}
        />
        <SignOutLoadingOverlay />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
