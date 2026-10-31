import { showLocalizedAlert } from "@/components/ui/LocalizedText";
import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { ChevronRightIcon } from "@/components/ui/ProfileIcons";
import { CloseIcon } from "@/components/ui/CloseIcon";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Switch,

    View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type VisibilityOption = "everyone" | "contacts" | "nobody";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const [profileVisibility, setProfileVisibility] = useState<VisibilityOption>("everyone");
  const [adsPersonalization, setAdsPersonalization] = useState(true);
  const [isVisibilityModalVisible, setIsVisibilityModalVisible] = useState(false);

  const visibilityLabel = {
    everyone: "Everyone",
    contacts: "Contacts Only",
    nobody: "Nobody",
  };

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
            Privacy
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Section Sub-header */}
          <Text
            allowFontScaling={false}
            className="mt-6 mb-3 font-semibold text-[18px] text-zeno-text-primary"
          >
            Privacy Options
          </Text>

          {/* Privacy Options List */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* Profile Visibility → opens modal */}
            <Pressable
              onPress={() => setIsVisibilityModalVisible(true)}
              className="flex-row items-center justify-between py-2"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Profile Visibility
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Who can see your profile
                </Text>
              </View>
              <View className="flex-row items-center gap-x-1.5">
                <Text
                  allowFontScaling={false}
                  className="font-medium text-[15px] text-zeno-text-secondary"
                >
                  {visibilityLabel[profileVisibility]}
                </Text>
                <ChevronRightIcon size={18} color="#6B7280" />
              </View>
            </Pressable>

            {/* Blocked Users */}
            <Pressable
              onPress={() =>
                showLocalizedAlert(
                  "Blocked users",
                  "You don't have any blocked users yet."
                )
              }
              className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4"
            >
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Blocked Users
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Manage blocked users
                </Text>
              </View>
              <View className="flex-row items-center gap-x-1.5">
                <Text
                  allowFontScaling={false}
                  className="font-medium text-[15px] text-zeno-text-secondary"
                >
                  0
                </Text>
                <ChevronRightIcon size={18} color="#6B7280" />
              </View>
            </Pressable>

            {/* Ads Personalization → switch */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Ads Personalization
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Personalize ads based on activity
                </Text>
              </View>
              <Switch
                value={adsPersonalization}
                onValueChange={setAdsPersonalization}
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Profile Visibility Modal */}
      <Modal
        visible={isVisibilityModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsVisibilityModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-[32px] bg-white p-6 shadow-2xl">
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                allowFontScaling={false}
                className="font-bold text-[22px] text-zeno-text-primary"
              >
                Profile Visibility
              </Text>
              <Pressable
                onPress={() => setIsVisibilityModalVisible(false)}
                className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >
                <CloseIcon size={14} color="#6B7280" />
              </Pressable>
            </View>

            <View className="gap-y-3 py-2">
              {(["everyone", "contacts", "nobody"] as VisibilityOption[]).map((option) => {
                const isSelected = profileVisibility === option;
                const descriptions = {
                  everyone: "Anyone on ZENO can find and view your profile",
                  contacts: "Only your contacts can view your profile",
                  nobody: "Your profile is hidden from everyone",
                };
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setProfileVisibility(option);
                      setIsVisibilityModalVisible(false);
                    }}
                    className={`flex-row items-center justify-between rounded-2xl p-4 border ${
                      isSelected
                        ? "border-[#70DF00] bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        allowFontScaling={false}
                        className="font-bold text-[17px] text-zeno-text-primary"
                      >
                        {visibilityLabel[option]}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        className="mt-0.5 text-[13px] text-zeno-text-secondary"
                      >
                        {descriptions[option]}
                      </Text>
                    </View>
                    <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300">
                      {isSelected && (
                        <View className="h-3.5 w-3.5 rounded-full bg-[#70DF00]" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

