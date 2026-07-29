import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
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
    <View className="flex-1" onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}
