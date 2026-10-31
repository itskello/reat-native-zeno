import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { LoginSettingsModal } from "@/components/account/LoginSettingsModal";
import { PinSecurityModal } from "@/components/account/PinSecurityModal";
import { UpdatePasswordModal } from "@/components/account/UpdatePasswordModal";
import { ChevronRightIcon } from "@/components/ui/ProfileIcons";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPinModalVisible, setIsPinModalVisible] = useState(false);
  const [isLoginSettingsVisible, setIsLoginSettingsVisible] = useState(false);

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <SettingsSkeleton rows={5} />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Top Header */}
        <View className="flex-row items-center pt-2">
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
            allowFontScaling={false}
            className="ml-4 font-bold text-[22px] text-zeno-text-primary"
          >
            Security
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Security Settings Card List */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* Change Password → opens UpdatePasswordModal */}
            <Pressable
              onPress={() => setIsPasswordModalVisible(true)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Change Password
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Update your account password
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Two-Factor Authentication → opens LoginSettingsModal */}
            <Pressable
              onPress={() => setIsLoginSettingsVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Two-Factor Authentication
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Add an extra layer of security
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* PIN Security → opens PinSecurityModal */}
            <Pressable
              onPress={() => setIsPinModalVisible(true)}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  PIN Security
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Change or reset your PIN code
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Devices → informational */}
            <Pressable
              onPress={() => router.push("/settings/devices")}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Devices
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Manage trusted devices
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Privacy settings are grouped under Security. */}
            <Pressable
              onPress={() => router.push("/settings/privacy")}
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Privacy
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Manage your profile and data privacy
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Modals */}
      <UpdatePasswordModal
        visible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
      />
      <PinSecurityModal
        visible={isPinModalVisible}
        onClose={() => setIsPinModalVisible(false)}
      />
      <LoginSettingsModal
        visible={isLoginSettingsVisible}
        onClose={() => setIsLoginSettingsVisible(false)}
      />
    </View>
  );
}

