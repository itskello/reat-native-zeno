import { Chevron } from "@/components/ui/Chevron";
import { SupportedCountry, supportedCountries } from "@/data/countries";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CountrySheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: SupportedCountry) => void;
  /**
   * Shows countries ZENO does not serve but that are usable for SMS testing.
   * Only enable it on the phone number picker, never on residency.
   */
  includeTestCountries?: boolean;
};

export function CountrySheet({
  visible,
  onClose,
  onSelect,
  includeTestCountries = false,
}: CountrySheetProps) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const countries = includeTestCountries
      ? supportedCountries
      : supportedCountries.filter((country) => !country.isTestOnly);

    if (!normalizedQuery) {
      return countries;
    }

    return countries.filter((country) =>
      `${country.name} ${country.isoCode}`.toLowerCase().includes(normalizedQuery)
    );
  }, [searchQuery, includeTestCountries]);

  const close = () => {
    setSearchQuery("");
    onClose();
  };

  const select = (country: SupportedCountry) => {
    setSearchQuery("");
    onSelect(country);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={close} />

        <View
          className="max-h-[70%] rounded-t-[28px] bg-white px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="items-center">
            <View className="h-[4px] w-[66px] rounded-full bg-[#D7D7D7]" />
          </View>

          <Text
            className="mt-9 ml-2 font-bold text-[26px] text-[#202020]"
            allowFontScaling={false}
          >
            Countries
          </Text>

          <View className="mt-4 h-[38px] justify-center rounded-full border border-[#DCDCDC] bg-[#E8E8E8] px-4">
            <TextInput
              className="font-medium text-[16px] text-[#2B2B2B]"
              placeholder="Search Countries"
              placeholderTextColor="#575757"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <ScrollView
            className="mt-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredCountries.length === 0 ? (
              <Text className="py-8 text-center font-medium text-base text-zeno-text-secondary">
                No countries found
              </Text>
            ) : (
              filteredCountries.map((item) => (
                <Pressable
                  key={item.id}
                  className="mb-7 flex-row items-center"
                  onPress={() => select(item)}
                >
                  <View className="h-[44px] w-[44px] items-center justify-center rounded-full bg-[#F2F2F2]">
                    <Image
                      source={item.flag}
                      style={{ width: 37, height: 37, borderRadius: 19 }}
                      contentFit="cover"
                    />
                  </View>
                  <Text
                    className="ml-5 flex-1 font-bold text-[19px] text-[#222222]"
                    allowFontScaling={false}
                  >
                    {item.name} ({item.isoCode})
                  </Text>
                  {item.isTestOnly ? (
                    <Text
                      className="mr-3 rounded-full bg-[#F1F1F1] px-3 py-1 font-medium text-[13px] text-zeno-text-secondary"
                      allowFontScaling={false}
                    >
                      Test
                    </Text>
                  ) : null}
                  <Chevron direction="right" size={13} thickness={2.5} />
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
