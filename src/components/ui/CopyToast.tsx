import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

type CopyToastProps = {
  /** Controls visibility of the toast */
  visible: boolean;
  /** Message to display (default: "Copied!") */
  message?: string;
  /** Position of the toast (default: "top") */
  position?: "top" | "bottom";
};

/**
 * CopyToast — Feedback toast component
 *
 * A small dark toast that appears briefly to confirm a clipboard copy action.
 * Auto-dismisses after 2 seconds with fade in/out animation.
 *
 * Usage:
 * ```tsx
 * const [showToast, setShowToast] = useState(false);
 *
 * const handleCopy = async () => {
 *   await Clipboard.setStringAsync(value);
 *   setShowToast(true);
 *   setTimeout(() => setShowToast(false), 2000);
 * };
 *
 * <CopyToast visible={showToast} message="Copied!" />
 * ```
 */
export function CopyToast({
  visible,
  message = "Copied!",
  position = "top",
}: CopyToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto fade out after 2 seconds
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      // Immediate fade out when visible becomes false
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: position === "top" ? 80 : undefined,
        bottom: position === "bottom" ? 80 : undefined,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 9999,
        opacity,
      }}
      pointerEvents="none"
    >
      <View
        className="rounded-xl px-5 py-3"
        style={{ backgroundColor: "#071706" }}
      >
        <Text
          allowFontScaling={false}
          className="text-[15px] font-medium text-white"
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
