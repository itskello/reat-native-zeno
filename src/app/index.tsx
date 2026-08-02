import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { images } from "@/constants/images";

const HOLD_DURATION = 1400;

export default function Index() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoShift = useRef(new Animated.Value(40)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineShift = useRef(new Animated.Value(16)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const intro = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoShift, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(taglineShift, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_DURATION),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 550,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    intro.start(({ finished }) => {
      if (finished) {
        router.replace("/welcome");
      }
    });

    return () => intro.stop();
  }, [logoOpacity, logoShift, taglineOpacity, taglineShift, screenOpacity]);

  return (
    <Animated.View
      className="flex-1 bg-zeno-intro"
      style={{ opacity: screenOpacity }}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ translateY: logoShift }],
          }}
        >
          <Image
            source={images.logoGreenLight}
            style={{ width: 232, height: 98 }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      <Animated.View
        className="items-center pb-[104px]"
        style={{
          opacity: taglineOpacity,
          transform: [{ translateY: taglineShift }],
        }}
      >
        <View className="flex-row items-center">
          <Image
            source={images.secureGreen}
            style={{ width: 26, height: 26 }}
            contentFit="contain"
          />
          <Text
            className="ml-3 font-bold text-[26px] text-white"
            allowFontScaling={false}
          >
            Your Money, Your Control.
          </Text>
        </View>
        <Text
          className="mt-2 font-medium text-[20px] text-[#E4F7C4]"
          allowFontScaling={false}
        >
          Secure. Fast. Simple
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
