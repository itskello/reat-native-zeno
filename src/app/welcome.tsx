import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "@/constants/images";

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pb-6"
        contentContainerStyle={{ paddingTop: 62 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Text
          className="font-bold text-[42px] leading-[48px] text-black"
          allowFontScaling={false}
        >
          Welcome To{"\n"}ZENO
        </Text>

        <Text
          className="mt-[26px] font-bold text-[19px] leading-[29px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          The Smart Way To Send, Receive And Manage Your Money
        </Text>

        <View className="flex-1 items-center justify-center py-4">
          <Image
            source={images.cardInWallet}
            style={{ width: "100%", aspectRatio: 1, maxHeight: 340 }}
            contentFit="contain"
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <View className="px-[10px]">
          <Pressable
            className="h-[58px] items-center justify-center rounded-full bg-zeno-green"
            onPress={() => router.push("/signup")}
          >
            <Text
              className="font-bold text-[21px] text-zeno-dark"
              allowFontScaling={false}
            >
              Create Account
            </Text>
          </Pressable>

          <Pressable
            className="mt-4 h-[58px] items-center justify-center rounded-full border border-zeno-dark"
            onPress={() => router.push("/login")}
          >
            <Text
              className="font-bold text-[21px] text-zeno-dark"
              allowFontScaling={false}
            >
              Log In
            </Text>
          </Pressable>
        </View>

        <View className="mt-7 flex-row flex-wrap items-center justify-center">
          <Text
            className="font-medium text-[15px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Need Help ?{" "}
          </Text>
          <Pressable onPress={() => router.push("/help")} hitSlop={8}>
            <Text
              className="font-medium text-[15px] text-zeno-link-blue"
              allowFontScaling={false}
            >
              Contact Support
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
