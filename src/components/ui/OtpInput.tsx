import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
};

/**
 * Underline-style OTP field. A single hidden TextInput owns the text so the
 * keyboard, paste and backspace all behave natively; the cells are pure
 * presentation driven by `value`.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const caretOpacity = useRef(new Animated.Value(1)).current;

  const activeIndex = Math.min(value.length, length - 1);

  useEffect(() => {
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

    blink.start();
    return () => blink.stop();
  }, [caretOpacity]);

  const handleChangeText = (text: string) => {
    onChange(text.replace(/\D/g, "").slice(0, length));
  };

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View className="flex-row justify-between">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index];
          const showCaret = isFocused && index === activeIndex && !digit;

          return (
            <View key={index} className="w-[44px] items-center">
              <View className="h-[62px] items-center justify-center">
                {digit ? (
                  <Text
                    className="font-bold text-[38px] text-zeno-link-blue"
                    allowFontScaling={false}
                  >
                    {digit}
                  </Text>
                ) : showCaret ? (
                  <Animated.View
                    className="w-[2px] bg-zeno-link-blue"
                    style={{ height: 44, opacity: caretOpacity }}
                  />
                ) : null}
              </View>
              <View className="h-[5px] w-full rounded-full bg-[#C9C9C9]" />
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus={autoFocus}
        caretHidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
        }}
      />
    </Pressable>
  );
}
