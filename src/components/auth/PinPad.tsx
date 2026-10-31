import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

export const PIN_LENGTH = 6;

// Bottom row leaves the first slot empty, matching the design: [ , 0, < ].
const KEYPAD_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "",
  "0",
  "back",
] as const;

type PinPadProps = {
  /** The current PIN value (as a string of digits). */
  value: string;
  /** Called with the updated PIN whenever a digit is added or removed. */
  onChange: (pin: string) => void;
  /** Number of PIN digits. Defaults to 6. */
  length?: number;
  /**
   * When provided, the empty bottom-left slot renders the fingerprint icon.
   * Tapping it triggers the biometric prompt.
   */
  onBiometric?: () => void;
};

/**
 * Shared PIN entry UI: a row of masked input cells plus a custom on-screen
 * numeric keypad. Used by Set Up PIN, Confirm PIN, Verify PIN, and PIN Settings.
 *
 * Sized responsively so all digits fit with clean gutters/spacing without
 * overflowing the screen width on any device size.
 */
export function PinPad({ value, onChange, length = PIN_LENGTH, onBiometric }: PinPadProps) {
  const handleKeyPress = (key: (typeof KEYPAD_KEYS)[number]) => {
    if (key === "") {
      return;
    }

    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }

    if (value.length < length) {
      onChange(value + key);
    }
  };

  return (
    <View className="w-full flex-1 justify-between">
      {/* PIN Digit Cells Row with responsive gap/gutter */}
      <View className="w-full flex-row items-center justify-center gap-x-2 sm:gap-x-3 px-1">
        {Array.from({ length }).map((_, index) => (
          <PinCell
            key={index}
            filled={index < value.length}
            active={index === value.length}
          />
        ))}
      </View>

      {/* Keypad */}
      <View className="mt-auto flex-row flex-wrap pb-2">
        {KEYPAD_KEYS.map((key, index) => {
          // Bottom-left empty slot: show fingerprint icon if biometrics available
          const isBiometricSlot = key === "" && onBiometric != null;

          return (
            <Pressable
              key={index}
              className="h-[68px] w-1/3 items-center justify-center"
              onPress={() => {
                if (isBiometricSlot) {
                  onBiometric();
                } else {
                  handleKeyPress(key);
                }
              }}
              disabled={key === "" && !isBiometricSlot}
              android_ripple={
                key === "" && !isBiometricSlot
                  ? undefined
                  : { color: "#00000010", borderless: true }
              }
              hitSlop={4}
            >
              {key === "back" ? (
                <BackspaceGlyph />
              ) : isBiometricSlot ? (
                <Image
                  source={images.bioSetupFingerprint}
                  style={{ width: 62, height: 62 }}
                  contentFit="contain"
                />
              ) : key === "" ? null : (
                <Text
                  className="font-medium text-[36px] text-black"
                  allowFontScaling={false}
                >
                  {key}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * A single PIN slot. Filled slots are masked with a dot, and the next slot
 * shows a blinking blue caret.
 */
function PinCell({ filled, active }: { filled: boolean; active: boolean }) {
  const caretOpacity = useMemo(() => new Animated.Value(1), []);
  const blinkRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      blinkRef.current?.stop();
      return;
    }

    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(caretOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(caretOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    blinkRef.current = blink;
    blink.start();
    return () => blink.stop();
  }, [active, caretOpacity]);

  return (
    <View className="flex-1 max-w-[48px] h-[62px] sm:h-[68px] items-center justify-center rounded-[18px] bg-[#E9E8F7]">
      {filled ? (
        <View className="h-[12px] w-[12px] rounded-full bg-zeno-dark" />
      ) : active ? (
        <Animated.View
          className="w-[2px] bg-zeno-link-blue"
          style={{ height: 28, opacity: caretOpacity }}
        />
      ) : null}
    </View>
  );
}

/** The "<" backspace glyph — a left-pointing chevron. */
function BackspaceGlyph() {
  return (
    <View
      style={{
        width: 15,
        height: 15,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderColor: "#0A1712",
        transform: [{ rotate: "45deg" }],
      }}
    />
  );
}
