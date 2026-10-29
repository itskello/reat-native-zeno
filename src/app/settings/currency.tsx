import { images } from "@/constants/images";
import { useAppStore } from "@/store/app-store";
import type { CurrencyCode } from "@/types/content";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CurrencyOption = {
  code: CurrencyCode | "USD" | "EUR" | "GBP";
  name: string;
  subtext: string;
  symbol: string;
};

const CURRENCIES: CurrencyOption[] = [
  { code: "XOF", name: "FCFA (XOF)", subtext: "Franc CFA UEMOA", symbol: "FCFA" },
  { code: "USD", name: "USD ($)", subtext: "Dollar Américain", symbol: "$" },
  { code: "EUR", name: "EUR (€)", subtext: "Euro", symbol: "€" },
  { code: "GBP", name: "GBP (£)", subtext: "Livre Sterling", symbol: "£" },
];

export default function CurrencyScreen() {
  const insets = useSafeAreaInsets();
  const selectedCurrency = useAppStore((s) => s.selectedCurrency);
  const setSelectedCountry = useAppStore((s) => s.setSelectedCountry);

  const handleSelect = (item: CurrencyOption) => {
    if (item.code === "XOF") {
      setSelectedCountry("cote-divoire");
      Alert.alert(
        "Devise mise à jour",
        `Devise principale réglée sur ${item.name}`
      );
    } else {
      Alert.alert(
        "Devise secondaire",
        `${item.name} sera utilisée pour la conversion d'affichage.`
      );
    }
  };

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
            Devise / Currency
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Subtitle Block */}
          <View className="mb-6">
            <Text
              allowFontScaling={false}
              className="font-bold text-[22px] text-zeno-text-primary"
            >
              Devise d'affichage
            </Text>
            <Text
              allowFontScaling={false}
              className="mt-1 font-medium text-[15px] text-zeno-text-secondary"
            >
              Sélectionnez la devise pour l'affichage de vos transactions.
            </Text>
          </View>

          {/* Currency List Card */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs">
            {CURRENCIES.map((item, index) => {
              const isSelected = selectedCurrency === item.code || (index === 0 && selectedCurrency === "XOF");
              return (
                <Pressable
                  key={item.code}
                  onPress={() => handleSelect(item)}
                  className={`flex-row items-center justify-between py-3 ${
                    index > 0 ? "border-t border-gray-100 mt-2 pt-4" : ""
                  }`}
                >
                  <View>
                    <Text
                      allowFontScaling={false}
                      className="font-semibold text-[17px] text-zeno-text-primary"
                    >
                      {item.name}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      className="text-[13px] text-zeno-text-secondary mt-0.5"
                    >
                      {item.subtext}
                    </Text>
                  </View>

                  {/* Radio Button */}
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isSelected
                        ? "border-[#70DF00]"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <View className="h-3.5 w-3.5 rounded-full bg-[#70DF00]" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}



