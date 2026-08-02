import { CheckIcon } from "@/components/ui/CheckIcon";
import { EyeIcon } from "@/components/ui/EyeIcon";
import { LockIcon } from "@/components/ui/LockIcon";
import { images } from "@/constants/images";
import { usePasswordReset } from "@/lib/use-password-reset";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** The rules shown under the first field, each turning green once satisfied. */
const PASSWORD_RULES = [
  { label: "At least 9 characters", test: (v: string) => v.length >= 9 },
  {
    label: "Use letters and numbers",
    test: (v: string) => /[a-zA-Z]/.test(v) && /\d/.test(v),
  },
  {
    label: "Include a special character",
    test: (v: string) => /[^a-zA-Z0-9]/.test(v),
  },
];

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const { setNewPassword, isSubmitting, error, setError } = usePasswordReset();

  const ruleState = useMemo(
    () => PASSWORD_RULES.map((rule) => rule.test(password)),
    [password]
  );

  const isFormValid = useMemo(
    () => ruleState.every(Boolean) && password === confirmPassword,
    [ruleState, password, confirmPassword]
  );

  const handleReset = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }

    const ok = await setNewPassword(password);
    if (ok) {
      // Password changed and the user is signed in. This is an existing account,
      // so it is already onboarded — go straight to the app.
      router.replace("/wallet");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            className="mt-11 font-bold text-[38px] leading-[44px] text-black"
            allowFontScaling={false}
          >
            Reset Password
          </Text>
          <Text
            className="mt-4 font-medium text-[19px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Create a new password
          </Text>

          <Text
            className="mt-[64px] font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            New password
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <LockIcon size={24} />
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder="********"
              placeholderTextColor="#9A9A9A"
              value={password}
              onChangeText={(next) => {
                setError(null);
                setPassword(next);
              }}
              secureTextEntry={!isPasswordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
            <Pressable
              onPress={() => setIsPasswordVisible((visible) => !visible)}
              hitSlop={12}
            >
              <EyeIcon size={28} crossed={isPasswordVisible} />
            </Pressable>
          </View>

          <View className="mt-6">
            {PASSWORD_RULES.map((rule, index) => {
              const satisfied = ruleState[index];
              return (
                <View key={rule.label} className="mb-4 flex-row items-center">
                  <View
                    className={`h-[26px] w-[26px] items-center justify-center rounded-full ${
                      satisfied ? "bg-zeno-green" : "bg-[#E3E3E3]"
                    }`}
                  >
                    <CheckIcon
                      size={15}
                      color={satisfied ? "#0A1712" : "#B4B4B4"}
                    />
                  </View>
                  <Text
                    className="ml-3 font-medium text-[18px] text-zeno-text-subtitle"
                    allowFontScaling={false}
                  >
                    {rule.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text
            className="mt-4 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Re-type the New Password
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <LockIcon size={24} />
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder="********"
              placeholderTextColor="#9A9A9A"
              value={confirmPassword}
              onChangeText={(next) => {
                setError(null);
                setConfirmPassword(next);
              }}
              secureTextEntry={!isConfirmVisible}
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
            <Pressable
              onPress={() => setIsConfirmVisible((visible) => !visible)}
              hitSlop={12}
            >
              <EyeIcon size={28} crossed={isConfirmVisible} />
            </Pressable>
          </View>

          {confirmPassword.length > 0 && password !== confirmPassword ? (
            <Text
              className="mt-4 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              Passwords do not match.
            </Text>
          ) : null}

          {error ? (
            <Text
              className="mt-4 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {error}
            </Text>
          ) : null}

          <Pressable
            className={`mt-auto h-[64px] items-center justify-center rounded-full ${
              isFormValid && !isSubmitting ? "bg-zeno-green" : "bg-[#D3D3D3]"
            }`}
            disabled={!isFormValid || isSubmitting}
            onPress={handleReset}
          >
            <Text
              className={`font-bold text-[22px] ${
                isFormValid && !isSubmitting ? "text-zeno-dark" : "text-[#ADADAD]"
              }`}
              allowFontScaling={false}
            >
              {isSubmitting ? "Resetting…" : "Reset Password"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
