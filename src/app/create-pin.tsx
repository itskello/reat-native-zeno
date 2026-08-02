import { PinPad, PIN_LENGTH } from "@/components/auth/PinPad";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreatePinScreen() {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");

  const isComplete = pin.length === PIN_LENGTH;

  const handleContinue = () => {
    if (!isComplete) {
      return;
    }

    // The PIN must be entered twice before being saved. Pass it to the confirm
    // step for matching. It is never persisted on device in plaintext — backend
    // registration happens after confirmation succeeds.
    router.push({ pathname: "/confirm-pin", params: { pin } });
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-4 pb-6">
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
          className="mt-11 font-bold text-[38px] leading-[44px] text-black"
          allowFontScaling={false}
        >
          Set Up PIN
        </Text>
        <Text
          className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Create a 4-digit PIN to secure your account.
        </Text>

        <View className="mt-[56px] flex-1">
          <PinPad value={pin} onChange={setPin} />
        </View>

        <Pressable
          className={`mt-8 h-[64px] items-center justify-center rounded-full ${
            isComplete ? "bg-zeno-green" : "bg-[#D3D3D3]"
          }`}
          disabled={!isComplete}
          onPress={handleContinue}
        >
          <Text
            className={`font-bold text-[22px] ${
              isComplete ? "text-zeno-dark" : "text-[#ADADAD]"
            }`}
            allowFontScaling={false}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
