import { EyeIcon } from "@/components/ui/EyeIcon";
import { LockIcon } from "@/components/ui/LockIcon";
import { images } from "@/constants/images";
import { useEmailSignIn } from "@/lib/use-email-sign-in";
import { useSocialSignIn } from "@/lib/use-social-sign-in";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded: isAuthLoaded, isSignedIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    signInWith,
    pendingProvider,
    error: socialError,
  } = useSocialSignIn();
  const {
    signInWithPassword,
    isSubmitting,
    error: passwordError,
    setError: setPasswordError,
  } = useEmailSignIn();

  // A session can already be active (e.g. left over from sign-up). Clerk rejects
  // a fresh sign-in while signed in ("you are already signed in"), so send an
  // authenticated user straight to the app instead of dead-ending on this form.
  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      // Even an already-active session must pass the PIN unlock before the app.
      router.replace("/verify-pin");
    }
  }, [isAuthLoaded, isSignedIn]);

  /**
   * Sign-in is email-only: Clerk holds the email, while the phone number lives
   * in ZENO's backend and is not a Clerk identifier. So we validate an email.
   */
  const isFormValid = useMemo(() => {
    return EMAIL_PATTERN.test(identifier.trim()) && password.length > 0;
  }, [identifier, password]);

  const handleLogin = async () => {
    if (!isFormValid || isSubmitting) {
      return;
    }

    const ok = await signInWithPassword(identifier, password);
    if (ok) {
      // Gate the wallet behind the PIN the user set during onboarding.
      router.replace("/verify-pin");
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
            Log In
          </Text>
          <Text
            className="mt-3 font-medium text-[19px] text-zeno-text-subtitle"
            allowFontScaling={false}
          >
            Welcome Back
          </Text>

          <Text
            className="mt-12 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Email or Phone number
          </Text>
          <View className="mt-3 h-[64px] justify-center rounded-[22px] bg-white px-6 shadow-card">
            <TextInput
              className="font-bold text-[17px] text-[#161616]"
              placeholder="johndoe@gmail.com"
              placeholderTextColor="#B4B4B4"
              value={identifier}
              onChangeText={(next) => {
                setPasswordError(null);
                setIdentifier(next);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
            />
          </View>

          <Text
            className="mt-8 font-medium text-[16px] text-[#252525]"
            allowFontScaling={false}
          >
            Password
          </Text>
          <View className="mt-3 h-[64px] flex-row items-center rounded-[22px] bg-white px-5 shadow-card">
            <LockIcon size={24} />
            <TextInput
              className="ml-4 flex-1 font-bold text-[17px] text-[#161616]"
              placeholder="********"
              placeholderTextColor="#9A9A9A"
              value={password}
              onChangeText={(next) => {
                setPasswordError(null);
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

          <Pressable
            className="mt-4 self-end"
            onPress={() => router.push("/forgot-password")}
            hitSlop={8}
          >
            <Text
              className="font-bold text-[17px] text-zeno-link-blue"
              allowFontScaling={false}
            >
              Forgot Password?
            </Text>
          </Pressable>

          {passwordError ? (
            <Text
              className="mt-4 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {passwordError}
            </Text>
          ) : null}

          <Pressable
            className={`mt-8 h-[64px] items-center justify-center rounded-full ${
              isFormValid && !isSubmitting ? "bg-zeno-green" : "bg-[#D3D3D3]"
            }`}
            disabled={!isFormValid || isSubmitting}
            onPress={handleLogin}
          >
            <Text
              className={`font-bold text-[22px] ${
                isFormValid && !isSubmitting ? "text-zeno-dark" : "text-[#ADADAD]"
              }`}
              allowFontScaling={false}
            >
              {isSubmitting ? "Logging In…" : "Log In"}
            </Text>
          </Pressable>
        </ScrollView>

        <View className="px-6 pb-4 pt-2">
          <View className="flex-row items-center">
            <View className="h-[1px] flex-1 bg-[#C9C9C9]" />
            <Text
              className="mx-3 font-medium text-[16px] text-[#3C3C3C]"
              allowFontScaling={false}
            >
              OR Continue With
            </Text>
            <View className="h-[1px] flex-1 bg-[#C9C9C9]" />
          </View>

          <Pressable
            className="mt-5 h-[64px] flex-row items-center rounded-[22px] bg-white px-6 shadow-card"
            onPress={() => signInWith("oauth_google")}
            disabled={pendingProvider !== null}
            style={({ pressed }) => ({
              opacity: pressed || pendingProvider !== null ? 0.6 : 1,
            })}
          >
            <Image
              source={images.google}
              style={{ width: 34, height: 34 }}
              contentFit="contain"
            />
            <Text
              className="flex-1 text-center font-medium text-[18px] text-[#252525]"
              allowFontScaling={false}
            >
              {pendingProvider === "oauth_google"
                ? "Signing In…"
                : "Login With Google"}
            </Text>
          </Pressable>

          {socialError ? (
            <Text
              className="mt-3 font-medium text-[15px] text-zeno-error"
              allowFontScaling={false}
            >
              {socialError}
            </Text>
          ) : null}

          <View className="mt-5 flex-row flex-wrap items-center justify-center">
            <Text
              className="font-bold text-[16px] text-[#252525]"
              allowFontScaling={false}
            >
              Don&apos;t Have An Account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/signup")} hitSlop={8}>
              <Text
                className="font-bold text-[16px] text-zeno-link-blue"
                allowFontScaling={false}
              >
                Create One
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
