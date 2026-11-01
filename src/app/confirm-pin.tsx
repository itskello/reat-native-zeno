import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { PIN_LENGTH, PinPad } from "@/components/auth/PinPad";
import { waitForPinLoading } from "@/components/auth/PinProcessingOverlay";
import { images } from "@/constants/images";
import { useSecurityStore } from "@/store/security-store";
import { registerTransactionPin } from "@/features/security/pin-service";
import { useAuth, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Confirm PIN screen.
 *
 * After the user creates a PIN on the previous screen, they must re-enter it
 * here to confirm. If the two PINs match, proceed to biometric setup. If they
 * don't match, show an error and allow retry.
 *
 * Security note: The PIN is passed via route params temporarily for this
 * confirmation step only. It is never persisted in plaintext — once confirmed,
 * it is stored salted and hashed in SecureStore (per Clerk user) so it can gate
 * unlock at login. The backend remains the source of truth for financial data.
 */
export default function ConfirmPinScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ pin: string }>();
  const initialPin = params.pin || "";
  const { user } = useUser();
  const { getToken } = useAuth();
  const setPin = useSecurityStore((state) => state.setPin);

  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isComplete = confirmPin.length === PIN_LENGTH;

  const handleChange = (pin: string) => {
    // Clear any previous mismatch error when the user edits their input.
    if (error) {
      setError(null);
    }
    setConfirmPin(pin);
  };

  const handleContinue = async () => {
    if (!isComplete || isSaving) {
      return;
    }

    // Verify that the confirmation PIN matches the initial PIN
    if (confirmPin !== initialPin) {
      setError("PINs don't match. Please try again.");
      setConfirmPin("");
      return;
    }

    // The Clerk session is active by now (email verification / Google sign-in
    // both complete before create-pin), so we can namespace the PIN by user id.
    if (!user?.id) {
      setError("Something went wrong. Please try again.");
      return;
    }

    // Keep the local unlock PIN and enroll a separately hashed copy on the
    // server so financial routes can validate it without trusting the device.
    const loadingStartedAt = Date.now();
    setIsSaving(true);
    const saved = await setPin(user.id, confirmPin);
    if (!saved) {
      await waitForPinLoading(loadingStartedAt);
      setIsSaving(false);
      setError("We couldn't save your PIN. Please try again.");
      return;
    }

    let registration:
      | Awaited<ReturnType<typeof registerTransactionPin>>
      | { ok: false; error: string };
    try {
      const token = await getToken();
      registration = token
        ? await registerTransactionPin(token, confirmPin)
        : { ok: false, error: "We couldn't finish setting up your PIN. Please try again." };
    } catch {
      registration = { ok: false, error: "We couldn't finish setting up your PIN. Please try again." };
    }
    await waitForPinLoading(loadingStartedAt);
    setIsSaving(false);

    if (!registration.ok) {
      setError(registration.error === "Un PIN de transaction est déjà configuré."
        ? "A transaction PIN is already set for this account."
        : "We couldn't finish setting up your PIN. Please try again.");
      return;
    }

    // Proceed to biometric setup
    router.replace("/biometric-setup");
  };

  const handleBack = () => {
    // Return to the create-pin screen to start over
    router.back();
  };

  return (
    <View
      className="flex-1 bg-zeno-auth-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 pt-4 pb-6">
        <Pressable
          className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
          onPress={handleBack}
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
          Confirm PIN
        </Text>
        <Text
          className="mt-4 font-medium text-[19px] leading-[26px] text-zeno-text-subtitle"
          allowFontScaling={false}
        >
          Re-enter your {PIN_LENGTH}-digit PIN to confirm.
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
          <PinPad
            value={confirmPin}
            onChange={handleChange}
            busy={isSaving}
          />
        </View>

        <Pressable
          className={`mt-8 h-[64px] items-center justify-center rounded-full ${
            isComplete && !isSaving ? "bg-zeno-green" : "bg-[#D3D3D3]"
          }`}
          disabled={!isComplete || isSaving}
          onPress={handleContinue}
        >
          <Text
            className={`font-bold text-[22px] ${
              isComplete && !isSaving ? "text-zeno-dark" : "text-[#ADADAD]"
            }`}
            allowFontScaling={false}
          >
            {isSaving ? "Saving…" : "Continue"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
