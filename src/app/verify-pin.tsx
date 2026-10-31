import { LocalizedTextInput as TextInput } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { PIN_LENGTH, PinPad } from "@/components/auth/PinPad";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { images } from "@/constants/images";
import { useSecurityStore } from "@/store/security-store";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,

  View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * PIN unlock screen.
 *
 * Shown right after a successful login (email/password OR Google) as a final
 * gate before the wallet. The user must enter the 6-digit PIN they created
 * during onboarding. This is a local unlock check against the salted+hashed PIN
 * in SecureStore.
 *
 * Biometric auto-trigger:
 * If the user has biometrics enabled, the native fingerprint/Face ID prompt
 * fires automatically on mount — just like banking apps (PayPal, Lydia, etc.).
 * Cancelling the prompt falls back to manual PIN entry.
 */
export default function VerifyPinScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { signOut } = useAuth();
  const verifyPin = useSecurityStore((state) => state.verifyPin);
  const hasPin = useSecurityStore((state) => state.hasPin);
  const biometricEnabled = useSecurityStore((state) => state.biometricEnabled);
  const loadBiometricPreference = useSecurityStore(
    (state) => state.loadBiometricPreference
  );

  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Forgot PIN reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Prevent the biometric prompt from firing more than once per screen mount
  const biometricTriggered = useRef(false);

  const isComplete = pin.length === PIN_LENGTH;

  // ─── Guard: redirect to create-pin if no PIN exists yet ────────────────────
  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      if (!user?.id) return;
      const exists = await hasPin(user.id);
      if (!cancelled && !exists) {
        router.replace("/create-pin");
      }
    };

    guard();
    return () => { cancelled = true; };
  }, [user?.id, hasPin]);

  // ─── Load biometric preference then auto-trigger if enabled ────────────────
  useEffect(() => {
    const init = async () => {
      // Load preference if not already in memory
      await loadBiometricPreference();
    };
    init();
  }, []);

  useEffect(() => {
    // Only fire once and only when we know the preference is true
    if (biometricEnabled !== true || biometricTriggered.current) return;
    biometricTriggered.current = true;
    triggerBiometric();
  }, [biometricEnabled]);

  /**
   * Trigger the native biometric prompt (fingerprint / Face ID).
   * On success → navigate directly to wallet (same as a correct PIN).
   * On cancel or failure → do nothing; user falls back to manual PIN entry.
   */
  const triggerBiometric = async () => {
    try {
      // Double-check hardware is available at runtime
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Déverrouiller ZENO",
        cancelLabel: "Utiliser le PIN",
        disableDeviceFallback: true, // We provide our own PIN fallback
        fallbackLabel: "",           // Hide "Use Passcode" — we have our own
      });

      if (result.success) {
        router.replace("/connection-success");
      }
      // result.error === "user_cancel" or "system_cancel" → just fall through
      // to the PIN pad silently. No error message shown.
    } catch {
      // Biometric hardware error — silently fall through to PIN entry
    }
  };

  const handleChange = (next: string) => {
    if (error) setError(null);
    setPin(next);
  };

  // ─── Auto-verify when all PIN digits are entered ───────────────────────────
  useEffect(() => {
    if (!isComplete || isChecking) return;

    let cancelled = false;

    const check = async () => {
      if (!user?.id) return;

      setIsChecking(true);
      const ok = await verifyPin(user.id, pin);
      if (cancelled) return;
      setIsChecking(false);

      if (ok) {
        router.replace("/connection-success");
      } else {
        setError("Code PIN incorrect. Veuillez réessayez.");
        setPin("");
      }
    };

    check();
    return () => { cancelled = true; };
  }, [isComplete]);

  const handleConfirmResetPin = async () => {
    setIsVerifyingReset(true);
    setResetError(null);
    try {
      setIsResetModalOpen(false);
      router.replace("/create-pin");
    } catch {
      setResetError("Échec de la réinitialisation. Veuillez réessayez.");
    } finally {
      setIsVerifyingReset(false);
    }
  };

  const handleUseAnotherAccount = async () => {
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
          Enter your {PIN_LENGTH}-digit PIN to unlock ZENO.
        </Text>

        {error ? (
          <Text
            className="mt-6 text-center font-medium text-[15px] text-zeno-error"
            allowFontScaling={false}
          >
            {error}
          </Text>
        ) : null}

        <View className="mt-[44px] flex-1">
          <PinPad
            value={pin}
            onChange={handleChange}
            onBiometric={
              biometricEnabled === true
                ? () => {
                    biometricTriggered.current = false;
                    triggerBiometric();
                    biometricTriggered.current = true;
                  }
                : undefined
            }
          />
        </View>
        {/* Action Buttons */}
        <View className="mt-6 gap-y-4 items-center">
          <Pressable
            onPress={() => setIsResetModalOpen(true)}
            hitSlop={8}
            className="py-1"
          >
            <Text
              className="font-bold text-[17px] text-zeno-blue"
              allowFontScaling={false}
            >
              Code PIN oublié ?
            </Text>
          </Pressable>

        </View>
      </View>

      {/* Forgot / Restore PIN Modal */}
      <Modal
        visible={isResetModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsResetModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-[32px] bg-white p-6 shadow-2xl">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-bold text-[22px] text-zeno-text-primary">
                Restaurer le Code PIN
              </Text>
              <Pressable
                onPress={() => setIsResetModalOpen(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >
                <CloseIcon size={14} color="#6B7280" />
              </Pressable>
            </View>

            <Text className="mb-4 font-medium text-[15px] text-zeno-text-secondary">
              Pour réinitialiser votre code PIN et en définir un nouveau à {PIN_LENGTH} chiffres, saisissez le mot de passe de votre compte ZENO.
            </Text>

            {resetError && (
              <View className="mb-4 rounded-xl bg-red-50 p-3">
                <Text className="font-semibold text-[14px] text-red-600">
                  {resetError}
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="mb-1.5 font-semibold text-[14px] text-zeno-text-secondary">
                Mot de passe du compte
              </Text>
              <View className="h-14 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 px-4">
                <TextInput
                  value={resetPassword}
                  onChangeText={setResetPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Mot de passe ZENO"
                  className="flex-1 font-semibold text-[16px] text-zeno-text-primary"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <EyeIcon crossed={!showPassword} size={20} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleConfirmResetPin}
              disabled={isVerifyingReset}
              className="h-14 items-center justify-center rounded-2xl bg-zeno-blue shadow-md"
            >
              {isVerifyingReset ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-bold text-[18px] text-white">
                  Définir un nouveau PIN ({PIN_LENGTH} chiffres)
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
