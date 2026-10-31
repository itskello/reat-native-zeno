import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NotificationPreferences = {
  loginEmail: boolean;
  transactionEmail: boolean;
  transactionPush: boolean;
};

const STORAGE_KEY = "zeno_notification_preferences";
const DEFAULT_PREFERENCES: NotificationPreferences = {
  loginEmail: true,
  transactionEmail: true,
  transactionPush: true,
};

function isNotificationPreferences(value: unknown): value is NotificationPreferences {
  if (!value || typeof value !== "object") return false;
  const preferences = value as Partial<NotificationPreferences>;
  return typeof preferences.loginEmail === "boolean" &&
    typeof preferences.transactionEmail === "boolean" &&
    typeof preferences.transactionPush === "boolean";
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const saved: unknown = JSON.parse(raw);
        if (isNotificationPreferences(saved)) setPreferences(saved);
      })
      .catch(() => {
        // Keep the defaults if local preference storage is unavailable.
      });
    return () => { active = false; };
  }, []);

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(preferences));
      showLocalizedAlert("Changes saved", "Your notification preferences have been saved.");
    } catch {
      showLocalizedAlert("Unable to save", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 px-5">
        <View className="flex-row items-center pt-2">
          <Pressable
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Image source={images.back} style={{ width: 50, height: 50 }} contentFit="contain" />
          </Pressable>
        </View>

        <Text allowFontScaling={false} className="mt-5 font-bold text-[30px] leading-[36px] text-zeno-text-primary">
          Notifications
        </Text>

        <ScrollView
          className="mt-10 flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <Text allowFontScaling={false} className="mb-4 ml-0.5 font-semibold text-[17px] text-zeno-text-primary">
            Login Alerts
          </Text>
          <View className="overflow-hidden rounded-[18px] bg-white px-5">
            <PreferenceRow
              label="Email"
              value={preferences.loginEmail}
              onValueChange={(value) => updatePreference("loginEmail", value)}
              isLast
            />
          </View>

          <Text allowFontScaling={false} className="mb-4 mt-9 ml-0.5 font-semibold text-[17px] text-zeno-text-primary">
            Transaction Alerts
          </Text>
          <View className="overflow-hidden rounded-[18px] bg-white px-5">
            <PreferenceRow
              label="Email"
              value={preferences.transactionEmail}
              onValueChange={(value) => updatePreference("transactionEmail", value)}
            />
            <PreferenceRow
              label="Push Notification"
              value={preferences.transactionPush}
              onValueChange={(value) => updatePreference("transactionPush", value)}
              isLast
            />
          </View>
        </ScrollView>

        <Pressable
          onPress={() => void saveChanges()}
          disabled={isSaving}
          accessibilityRole="button"
          className={`mb-5 h-[58px] items-center justify-center rounded-[16px] bg-zeno-blue ${isSaving ? "opacity-60" : "active:opacity-80"}`}
        >
          <Text allowFontScaling={false} className="font-semibold text-[16px] text-white">
            Save changes
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function PreferenceRow({
  label,
  value,
  onValueChange,
  isLast = false,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View className={`h-[78px] flex-row items-center justify-between ${isLast ? "" : "border-b border-[#EEF1F4]"}`}>
      <Text allowFontScaling={false} className="font-medium text-[16px] text-zeno-text-primary">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#D1D5DB", true: "#0057FF" }}
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}
