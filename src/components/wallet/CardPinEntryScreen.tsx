import { LocalizedText as Text } from "@/components/ui/LocalizedText";
/**
 * CardPinEntryScreen — Full-screen lime-green PIN entry for ZENO Card
 *
 * A dedicated PIN entry screen used before revealing sensitive card details.
 * Design: lime-green background (#B9E057) with rounded shape, 6 circular dots,
 * custom numpad with biometric icon in bottom-left.
 *
 * Design ref: assets/03 · Carte/06 & 07 (Figma exact match)
 */

import { images } from "@/constants/images";
import { Image } from "expo-image";
import { ZenoCardLogo } from "@/components/wallet/ZenoCardLogo";
import { PinProcessingOverlay } from "@/components/auth/PinProcessingOverlay";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LIME = "#B9E057"; // Exact Figma color
const DARK = "#0A1712";
const PIN_LENGTH = 6;

const NUMPAD_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["bio", "0", "back"],
] as const;

type CardPinEntryScreenProps = {
  /** Current PIN value (string of digits) */
  pin: string;
  /** Called when PIN changes */
  onPinChange: (pin: string) => void;
  /** Called when back button is pressed */
  onBack: () => void;
  /** Optional biometric authentication handler */
  onBiometric?: () => void;
  /** Error message to display */
  error: string | null;
  /** Whether the PIN is being verified (shows spinner) */
  busy?: boolean;
};

export function CardPinEntryScreen({
  pin,
  onPinChange,
  onBack,
  onBiometric,
  error,
  busy = false,
}: CardPinEntryScreenProps) {
  const insets = useSafeAreaInsets();

  const handleKeyPress = (key: (typeof NUMPAD_KEYS)[number][number]) => {
    if (busy) return;

    if (key === "back") {
      onPinChange(pin.slice(0, -1));
    } else if (key === "bio" && onBiometric) {
      onBiometric();
    } else if (key !== "bio" && pin.length < PIN_LENGTH) {
      onPinChange(pin + key);
    }
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: LIME,
        paddingTop: 0,
        paddingBottom: Math.max(insets.bottom, 16) + 10,
      }}
    >
        <View className="flex-row items-center justify-between px-4 pt-7">
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low active:opacity-60"
          >
            <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
          </Pressable>
          <View className="h-[46px] w-[46px]" />
        </View>

        {/* Figma places the large ZENO Card wordmark well below the back control. */}
        <View className="mt-[110px] items-center px-6">
          <ZenoCardLogo height={50} variant="dark" />
          <Text
            allowFontScaling={false}
            className="mt-2 text-[18px] font-semibold text-center"
            style={{ color: DARK }}
          >
            Enter Your PIN
          </Text>
        </View>
      {/* PIN Dots */}
      <View className="mt-7 flex-row items-center justify-center gap-x-7">
        {Array.from({ length: PIN_LENGTH }).map((_, index) => (
          <View
            key={index}
            className="h-[8px] w-[8px] rounded-full"
            style={{
              backgroundColor: index < pin.length ? DARK : "#91AD3D",
            }}
          />
        ))}
      </View>

      {/* Error message */}
      {error ? (
        <View className="mt-4 px-8">
          <Text
            allowFontScaling={false}
            className="text-center text-[14px] font-medium"
            style={{ color: "#EF4444" }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View className="flex-1" />

      {/* Numpad */}
      <View className="px-4 pb-5">
        {NUMPAD_KEYS.map((row, rowIndex) => (
          <View key={rowIndex} className="mb-2 flex-row justify-evenly">
            {row.map((key) => {
              const isBiometric = key === "bio";
              const isBackspace = key === "back";
              const isDisabled = isBiometric && !onBiometric;

              return (
                <Pressable
                  key={key}
                  onPress={() => handleKeyPress(key)}
                  disabled={isDisabled || busy}
                  hitSlop={8}
                  className="items-center justify-center active:opacity-50"
                  style={{
                    width: "30%",
                    height: 64,
                    opacity: isDisabled ? 0 : 1,
                  }}
                >
                  {isBiometric ? (
                    <Image
                      source={images.bioSetupFingerprint}
                      style={{ width: 58, height: 58 }}
                      contentFit="contain"
                      tintColor="#7D9838"
                    />
                  ) : isBackspace ? (
                    <Text allowFontScaling={false} className="text-[36px] text-black">‹</Text>
                  ) : (
                    <Text
                      allowFontScaling={false}
                      className="text-[40px] font-medium"
                      style={{ color: DARK }}
                    >
                      {key}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
      <PinProcessingOverlay visible={busy} variant="green" />
    </View>
  );
}
