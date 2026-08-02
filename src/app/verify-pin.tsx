import { PinPad, PIN_LENGTH } from "@/components/auth/PinPad";
import { images } from "@/constants/images";
import { useSecurityStore } from "@/store/security-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * PIN unlock screen.
 *
 * Shown right after a successful login (email/password OR Google) as a final
 * gate before the wallet. The user must enter the 4-digit PIN they created
 * during onboarding. This is a local unlock check against the salted+hashed PIN
 * in SecureStore — the Clerk session is already active; the backend stays the
 * source of truth for every financial action.
 */
export default function VerifyPinScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const verifyPin = useSecurityStore((state) => state.verifyPin);
  const hasPin = useSecurityStore((state) => state.hasPin);

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const isComplete = pin.length === PIN_LENGTH;

  // If this account has no local PIN (e.g. onboarding didn't set one on this
  // device), there is nothing to unlock — send them straight to the wallet.
  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      if (!user?.id) {
        return;
      }
      const exists = await hasPin(user.id);
      if (!cancelled && !exists) {
        // No local PIN to check (e.g. onboarded on another device). Skip the
        // unlock but keep the same login transition into the wallet.
        router.replace("/connection-success");
      }
    };

    guard();

    return () => {
      cancelled = true;
    };
  }, [user?.id, hasPin]);

  const handleChange = (next: string) => {
    if (error) {
      setError(null);
    }
    setPin(next);
  };

  // Verify automatically once all digits are entered — no extra button press.
  useEffect(() => {
    if (!isComplete || isChecking) {
      return;
    }

    let cancelled = false;

    const check = async () => {
      if (!user?.id) {
        return;
      }

      setIsChecking(true);
      const ok = await verifyPin(user.id, pin);
      if (cancelled) {
        return;
      }
      setIsChecking(false);

      if (ok) {
        // PIN correct: show the "Connection Successful" transition while the
        // wallet preloads in the background, then land on Wallet Home.
        router.replace("/connection-success");
      } else {
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    };

    check();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleUseAnotherAccount = async () => {
    // Escape hatch: sign out and go back to the welcome flow.
    await signOut();
    router.replace("/welcome");
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-4 pb-6">
        <Pressable
          className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
          onPress={handleUseAnotherAccount}
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
          Enter PIN
        </Text>
        <Text
          className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Enter your 4-digit PIN to unlock ZENO.
        </Text>

        {error ? (
          <Text
            className="mt-6 text-center font-medium text-[15px] text-zeno-error"
            allowFontScaling={false}
          >
            {error}
          </Text>
        ) : null}

        <View className="mt-[56px] flex-1">
          <PinPad value={pin} onChange={handleChange} />
        </View>

        <Pressable
          className="mt-8 items-center"
          onPress={handleUseAnotherAccount}
          hitSlop={8}
        >
          <Text
            className="font-bold text-[17px] text-zeno-link-blue"
            allowFontScaling={false}
          >
            Use another account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
