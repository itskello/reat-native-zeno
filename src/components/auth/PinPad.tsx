import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

export const PIN_LENGTH = 4;

// Bottom row leaves the first slot empty, matching the design: [ , 0, < ].
const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

type PinPadProps = {
  /** The current PIN value (as a string of digits). */
  value: string;
  /** Called with the updated PIN whenever a digit is added or removed. */
  onChange: (pin: string) => void;
  /** Number of PIN digits. Defaults to 4. */
  length?: number;
};

/**
 * Shared PIN entry UI: a row of masked input cells plus a custom on-screen
 * numeric keypad. Used by both the Set Up PIN and Confirm PIN screens.
 *
 * The component is presentational — it owns no PIN state itself. The parent
 * holds the PIN value and receives updates via `onChange`, keeping this
 * component reusable and the PIN handling logic in one place per screen.
 */
export function PinPad({ value, onChange, length = PIN_LENGTH }: PinPadProps) {
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
    <>
      <View className="flex-row justify-between">
        {Array.from({ length }).map((_, index) => (
          <PinCell
            key={index}
            filled={index < value.length}
            active={index === value.length}
          />
        ))}
      </View>

      <View className="mt-auto flex-row flex-wrap">
        {KEYPAD_KEYS.map((key, index) => (
          <Pressable
            key={index}
            className="h-[74px] w-1/3 items-center justify-center"
            onPress={() => handleKeyPress(key)}
            disabled={key === ""}
            android_ripple={
              key === "" ? undefined : { color: "#00000010", borderless: true }
            }
            hitSlop={4}
          >
            {key === "back" ? (
              <BackspaceGlyph />
            ) : key === "" ? null : (
              <Text
                className="font-medium text-[42px] text-black"
                allowFontScaling={false}
              >
                {key}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </>
  );
}

/**
 * A single PIN slot. Filled slots are masked with a dot (never the digit), and
 * the next slot to fill shows a blinking blue caret, matching the design.
 */
function PinCell({ filled, active }: { filled: boolean; active: boolean }) {
  // Create the Animated.Value once using useMemo to satisfy React's rules of hooks
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
    <View className="h-[82px] w-[73px] items-center justify-center rounded-[24px] bg-[#E9E8F7]">
      {filled ? (
        <View className="h-[14px] w-[14px] rounded-full bg-zeno-dark" />
      ) : active ? (
        <Animated.View
          className="w-[2px] bg-zeno-link-blue"
          style={{ height: 40, opacity: caretOpacity }}
        />
      ) : null}
    </View>
  );
}

/** The "<" backspace glyph — a left-pointing chevron drawn from two borders. */
function BackspaceGlyph() {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        borderLeftWidth: 3.5,
        borderBottomWidth: 3.5,
        borderColor: "#0A1712",
        transform: [{ rotate: "45deg" }],
      }}
    />
  );
}
