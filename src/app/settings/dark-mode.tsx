import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DarkModeScreen() {
  const insets = useSafeAreaInsets();
  const [isDarkEnabled, setIsDarkEnabled] = useState(true);

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Top Header */}
        <View className="flex-row items-center pt-2">
          <Pressable
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Image
              source={images.back}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
            />
          </Pressable>
          <Text
            allowFontScaling={false}
            className="ml-4 font-bold text-[22px] text-zeno-text-primary"
          >
            Dark Mode
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Main Dark Mode Toggle Card */}
          <View className="flex-row items-center justify-between rounded-[28px] bg-white p-5 shadow-xs">
            <View className="flex-1 pr-4">
              <Text
                allowFontScaling={false}
                className="font-bold text-[18px] text-zeno-text-primary"
              >
                Dark Mode
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-1 font-medium text-[14px] text-zeno-text-secondary leading-[20px]"
              >
                Reduce eye strain and save battery by using dark theme.
              </Text>
            </View>
            <Switch
              value={isDarkEnabled}
              onValueChange={setIsDarkEnabled}
              trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Visual Theme Preview Cards */}
          <View className="mt-8 flex-row gap-x-4">
            {/* Light Mode Preview */}
            <Pressable
              onPress={() => setIsDarkEnabled(false)}
              className="flex-1 items-center"
            >
              <View
                className={`w-full rounded-[24px] border-2 p-3 ${
                  !isDarkEnabled ? "border-[#70DF00] bg-white" : "border-gray-200 bg-gray-50"
                }`}
              >
                <View className="h-44 rounded-2xl bg-[#F4FAFF] p-3 justify-between">
                  <View className="h-8 rounded-xl bg-white shadow-xs w-full" />
                  <View className="h-14 rounded-2xl bg-zeno-blue/10 w-full" />
                  <View className="h-10 rounded-xl bg-white w-full" />
                </View>
              </View>
              <View className="mt-3 flex-row items-center gap-x-2">
                <Text
                  allowFontScaling={false}
                  className="font-bold text-[15px] text-zeno-text-primary"
                >
                  Light Mode
                </Text>
                <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                  {!isDarkEnabled && (
                    <View className="h-3 w-3 rounded-full bg-[#70DF00]" />
                  )}
                </View>
              </View>
            </Pressable>

            {/* Dark Mode Preview */}
            <Pressable
              onPress={() => setIsDarkEnabled(true)}
              className="flex-1 items-center"
            >
              <View
                className={`w-full rounded-[24px] border-2 p-3 ${
                  isDarkEnabled ? "border-[#70DF00] bg-zeno-dark" : "border-gray-200 bg-gray-900"
                }`}
              >
                <View className="h-44 rounded-2xl bg-black p-3 justify-between">
                  <View className="h-8 rounded-xl bg-gray-900 shadow-xs w-full" />
                  <View className="h-14 rounded-2xl bg-zeno-green/20 w-full" />
                  <View className="h-10 rounded-xl bg-gray-900 w-full" />
                </View>
              </View>
              <View className="mt-3 flex-row items-center gap-x-2">
                <Text
                  allowFontScaling={false}
                  className="font-bold text-[15px] text-zeno-text-primary"
                >
                  Dark Mode
                </Text>
                <View className="h-5 w-5 items-center justify-center rounded-full border-2 border-gray-300">
                  {isDarkEnabled && (
                    <View className="h-3 w-3 rounded-full bg-[#70DF00]" />
                  )}
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

