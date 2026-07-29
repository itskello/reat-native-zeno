import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#0A1712]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Logo - centered vertically in middle of screen */}
      <View className="flex-1 items-center justify-center px-6">
        <Image
          source={require("../../assets/images/Logo green.png")}
          style={{ width: 280, height: 120 }}
          contentFit="contain"
        />
      </View>

      {/* Tagline block - anchored to bottom */}
      <View className="items-center gap-3 pb-20 px-6">
        {/* "Your Money, Your Control" with secure icon */}
        <View className="flex-row items-center gap-2">
          <Image
            source={require("../../assets/images/secure green.png")}
            style={{ width: 20, height: 20 }}
            contentFit="contain"
          />
          <Text
            className="text-white font-semibold text-base leading-snug"
            allowFontScaling={false}
          >
            Your Money, Your Control.
          </Text>
        </View>

        {/* "Secure. Fast. Simple" */}
        <Text
          className="text-gray-400 font-normal text-sm leading-snug"
          allowFontScaling={false}
        >
          Secure. Fast. Simple
        </Text>
      </View>

      {/* Navigation - tap to continue */}
      <Pressable
        onPress={() => router.push("/")}
        className="absolute inset-0"
        accessible
        accessibilityLabel="Tap to continue to home"
        accessibilityRole="button"
      />
    </View>
  );
}
