import { Chevron } from "@/components/ui/Chevron";
import { CountrySheet } from "@/components/ui/CountrySheet";
import { images } from "@/constants/images";
import { SupportedCountry } from "@/data/countries";
import { useOnboardingStore } from "@/store/onboarding-store";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [isCountrySheetOpen, setIsCountrySheetOpen] = useState(false);
  const selectedCountry = useOnboardingStore((state) => state.residencyCountry);
  const setResidencyCountry = useOnboardingStore(
    (state) => state.setResidencyCountry
  );

  const handleSelectCountry = (country: SupportedCountry) => {
    setResidencyCountry(country);
    setIsCountrySheetOpen(false);
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
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
          className="mt-10 font-bold text-[40px] leading-[46px] text-black"
          allowFontScaling={false}
        >
          Where Do You{"\n"}Live
        </Text>

        <Text
          className="mt-6 font-bold text-[18px] leading-[28px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          This Will Help Us Customize Your Experience Based On Your Location
        </Text>

        <View className="mt-[76px] px-[10px]">
          <Text
            className="ml-1 font-semibold text-[15px] text-[#202020]"
            allowFontScaling={false}
          >
            Country Of Residency
          </Text>

          <Pressable
            className="mt-3 h-[54px] flex-row items-center rounded-[20px] bg-white px-5 shadow-card"
            onPress={() => setIsCountrySheetOpen(true)}
          >
            {selectedCountry ? (
              <Image
                source={selectedCountry.flag}
                style={{ width: 32, height: 32, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : null}
            <Text
              className={`flex-1 font-medium text-[17px] text-[#252525] ${
                selectedCountry ? "ml-[14px]" : ""
              }`}
              allowFontScaling={false}
            >
              {selectedCountry ? selectedCountry.name : "Select Country"}
            </Text>
            <Chevron direction="down" size={11} />
          </Pressable>
        </View>
      </ScrollView>

      <View className="px-6 pb-4 pt-2">
        <Pressable
          className={`mx-[10px] h-[56px] items-center justify-center rounded-full ${
            selectedCountry ? "bg-zeno-green" : "bg-[#D3D3D3]"
          }`}
          disabled={!selectedCountry}
          onPress={() => router.push("/signup-details")}
        >
          <Text
            className={`font-bold text-[20px] ${
              selectedCountry ? "text-zeno-dark" : "text-[#ADADAD]"
            }`}
            allowFontScaling={false}
          >
            Create Account
          </Text>
        </Pressable>

        <View className="mt-6 flex-row flex-wrap items-center justify-center">
          <Text
            className="font-medium text-[15px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Already Have An Account?{" "}
          </Text>
          <Pressable onPress={() => router.push("/login")} hitSlop={8}>
            <Text
              className="font-bold text-[15px] text-zeno-link-blue"
              allowFontScaling={false}
            >
              Login
            </Text>
          </Pressable>
        </View>
      </View>

      <CountrySheet
        visible={isCountrySheetOpen}
        onClose={() => setIsCountrySheetOpen(false)}
        onSelect={handleSelectCountry}
      />
    </View>
  );
}
