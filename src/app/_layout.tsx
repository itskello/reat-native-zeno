import { tokenCache } from "@/lib/token-cache";
import { ClerkProvider } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";

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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
        .catch(() => {})
        .finally(() => setIsReady(true));
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!isReady) {
    return null;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            animationDuration: 450,
          }}
        />
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
