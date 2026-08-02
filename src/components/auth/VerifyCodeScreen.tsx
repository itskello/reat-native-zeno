import { OtpInput } from "@/components/ui/OtpInput";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;
export const RESEND_DELAY_SECONDS = 45;

type VerifyCodeScreenProps = {
  title: string;
  /** Phone number or email address the code was sent to. */
  sentTo: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
  onVerified: () => void;
  isVerifying: boolean;
  error: string | null;
  onCodeChange?: () => void;
};

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

/**
 * Shared layout for the phone and email code steps: they differ only in their
 * copy and which Clerk endpoint they call.
 */
export function VerifyCodeScreen({
  title,
  sentTo,
  onVerify,
  onResend,
  onVerified,
  error,
  onCodeChange,
}: VerifyCodeScreenProps) {
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY_SECONDS);

  // Keep the latest callbacks in refs so the auto-submit effect can stay
  // dependent on `code` alone. Depending on the callbacks directly would let a
  // re-render (which recreates them) re-fire the effect and resubmit the code.
  const onVerifyRef = useRef(onVerify);
  const onVerifiedRef = useRef(onVerified);
  onVerifyRef.current = onVerify;
  onVerifiedRef.current = onVerified;

  // Guards against submitting the same 6-digit code more than once — the source
  // of the previous verify/rate-limit loop.
  const submittedCodeRef = useRef<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  // Auto-submits as soon as the last digit lands — no Continue button by design.
  useEffect(() => {
    if (code.length !== OTP_LENGTH) {
      // Editing the code back down re-arms it for a fresh submission.
      if (code.length === 0) {
        submittedCodeRef.current = null;
      }
      return;
    }

    // Each full code is verified exactly once, regardless of re-renders.
    if (submittedCodeRef.current === code) {
      return;
    }
    submittedCodeRef.current = code;

    let isActive = true;

    onVerifyRef.current(code).then((succeeded) => {
      if (!isActive) {
        return;
      }

      if (succeeded) {
        onVerifiedRef.current();
      } else {
        setCode("");
        submittedCodeRef.current = null;
      }
    });

    return () => {
      isActive = false;
    };
  }, [code]);

  const handleCodeChange = (next: string) => {
    onCodeChange?.();
    setCode(next);
  };

  const handleResend = async () => {
    const sent = await onResend();

    if (sent) {
      setCode("");
      setSecondsLeft(RESEND_DELAY_SECONDS);
    }
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          className="mt-[110px] font-bold text-[38px] leading-[44px] text-black"
          allowFontScaling={false}
        >
          {title}
        </Text>

        <Text
          className="mt-8 font-medium text-[19px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Enter The 6-Digit Code Sent To
        </Text>
        <Text
          className="mt-2 font-bold text-[21px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          {sentTo}
        </Text>

        <View className="mt-11">
          <OtpInput
            value={code}
            onChange={handleCodeChange}
            length={OTP_LENGTH}
          />
        </View>

        {error ? (
          <Text
            className="mt-5 font-medium text-[15px] text-zeno-error"
            allowFontScaling={false}
          >
            {error}
          </Text>
        ) : null}

        <View className="mt-[60px] items-center">
          {secondsLeft > 0 ? (
            <Text
              className="font-bold text-[19px] text-zeno-text-subtitle"
              allowFontScaling={false}
            >
              Resend Code In{" "}
              <Text className="text-zeno-link-blue">
                {formatCountdown(secondsLeft)}
              </Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend} hitSlop={8}>
              <Text
                className="font-bold text-[19px] text-zeno-link-blue"
                allowFontScaling={false}
              >
                Resend Code
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
