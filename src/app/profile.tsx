import { LocalizedText as Text } from "@/components/ui/LocalizedText";
﻿import { FloatingGlassNavBar } from "@/components/ui/FloatingGlassNavBar";
import { ProfileSkeleton } from "@/components/ui/Skeleton";
import { DeleteAccountModal } from "@/components/account/DeleteAccountModal";
import { EditProfileModal } from "@/components/account/EditProfileModal";
import { KycModal } from "@/components/account/KycModal";
import { LogoutModal } from "@/components/account/LogoutModal";
import {
    BellOutlineIcon,
    ChevronRightIcon,
    CurrencyIcon,
    GlobeIcon,
    InfoIcon,
    SecurityLinkIcon,
    SecurityWalletIcon,
    ShieldOutlineIcon,
    SupportIcon,
    VerifiedBadgeIcon,
} from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { useAppStore } from "@/store/app-store";
import { useLanguageStore } from "@/store/language-store";
import type { CountryId } from "@/types/content";
import { useUser } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { router } from "expo-router";
import { memo, useCallback, useState } from "react";
import {
    Pressable,
    ScrollView,

    View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoaded } = useUser();

  const selectedCurrency = useAppStore((s) => s.selectedCurrency);
  const selectedLanguage = useLanguageStore((s) => s.language);

  // Modals visibility state
  const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);
  const [isKycVisible, setIsKycVisible] = useState(false);
  const [submittedKycPending, setSubmittedKycPending] = useState(false);
  const savedKycStatus = user?.publicMetadata?.kycStatus;
  const kycStatus: "verified" | "pending" | "unverified" = submittedKycPending
    ? "pending"
    : savedKycStatus === "verified" || savedKycStatus === "pending"
      ? savedKycStatus
      : "unverified";
  const rawCountryId = user?.publicMetadata?.countryId ?? user?.unsafeMetadata?.countryId;
  const kycCountryId: CountryId = rawCountryId === "cote-divoire" || rawCountryId === "togo"
    ? rawCountryId
    : rawCountryId === "benin"
      ? "benin"
      : user?.phoneNumbers?.[0]?.phoneNumber.startsWith("+225")
        ? "cote-divoire"
        : "benin";
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);
  const [isLogoutVisible, setIsLogoutVisible] = useState(false);

  // Stable handlers — prevents inline arrow fn recreation on every render
  const openEditProfile = useCallback(() => setIsEditProfileVisible(true), []);
  const closeEditProfile = useCallback(() => setIsEditProfileVisible(false), []);
  const openKyc = useCallback(() => setIsKycVisible(true), []);
  const closeKyc = useCallback(() => setIsKycVisible(false), []);
  const openDeleteAccount = useCallback(() => setIsDeleteAccountVisible(true), []);
  const closeDeleteAccount = useCallback(() => setIsDeleteAccountVisible(false), []);
  const openLogout = useCallback(() => setIsLogoutVisible(true), []);
  const closeLogout = useCallback(() => setIsLogoutVisible(false), []);

  const goLanguage = useCallback(() => router.push("/settings/language"), []);
  const goCurrency = useCallback(() => router.push("/settings/currency"), []);
  const goNotifications = useCallback(() => router.push("/settings/notifications"), []);
  const goSecurity = useCallback(() => router.push("/settings/security"), []);
  const goSupport = useCallback(() => router.push("/settings/support"), []);
  const goAbout = useCallback(() => router.push("/settings/about"), []);
  const goBack = useCallback(() => router.back(), []);

  const displayName = user
    ? user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "ZENO User"
    : "ZENO User";

  const avatarSource = user?.imageUrl
    ? { uri: user.imageUrl }
    : images.avatarPlaceholder;

  // Show skeleton while Clerk user data is loading
  if (!isLoaded) {
    return (
      <View
        className="flex-1 bg-[#EAF6FF]"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <ProfileSkeleton />
        <FloatingGlassNavBar activeTab="profile" />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#EAF6FF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Top Header Row with official ZENO back button */}
        <View className="flex-row items-center pt-2">
          <Pressable
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            onPress={goBack}
            hitSlop={12}
          >
            <Image
              source={images.back}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
            />
          </Pressable>
        </View>

        {/* Screen Title according to AGENTS.md H1 scale (32px Bold) */}
        <Text
          allowFontScaling={false}
          className="mt-6 font-bold text-[32px] leading-[38px] text-zeno-text-primary"
        >
          Profile
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          className="mt-3"
        >
          {/* User Profile Info Card */}
          <Pressable
            onPress={openEditProfile}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center flex-1">
              <Image
                source={avatarSource}
                style={{ width: 64, height: 64, borderRadius: 32 }}
                contentFit="cover"
              />
              <View className="ml-4 flex-1">
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  className="font-bold text-[22px] leading-[26px] text-zeno-text-primary"
                >
                  {displayName}
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 font-medium text-[15px] text-zeno-text-secondary"
                >
                  Edit Your Profile
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={22} color="#071706" />
          </Pressable>

          {/* KYC / Identity Banner Card */}
          <Pressable
            onPress={openKyc}
            disabled={kycStatus === "verified"}
            accessibilityRole={kycStatus === "verified" ? "text" : "button"}
            className="mt-6 flex-row items-center justify-between rounded-[26px] bg-white p-5 shadow-xs"
          >
            <View className="flex-1">
              <Text allowFontScaling={false} className="font-bold text-[18px] text-zeno-text-primary">
                Identity verification
              </Text>
              {kycStatus === "verified" ? (
                <Text allowFontScaling={false} className="mt-1 text-[13px] text-zeno-text-secondary">Verified</Text>
              ) : kycStatus === "pending" ? (
                <Text allowFontScaling={false} className="mt-1 text-[13px] text-zeno-text-secondary">Verification pending</Text>
              ) : null}
            </View>
            {kycStatus === "verified" ? <VerifiedBadgeIcon size={28} /> : <ShieldOutlineIcon size={28} color="#0057FF" />}
          </Pressable>

          {/* General Section Header */}
          <Text
            allowFontScaling={false}
            className="mt-6 mb-3 font-semibold text-[20px] text-zeno-text-primary"
          >
            General
          </Text>

          {/* General Section White Container Card */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* Language → navigates to settings page */}
            <Pressable
              onPress={goLanguage}
              className="flex-row items-center justify-between py-1"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <GlobeIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Language
                </Text>
              </View>
              <View className="flex-row items-center gap-x-1.5">
                <Text
                  allowFontScaling={false}
                  className="font-medium text-[15px] text-zeno-text-secondary"
                >
                  {selectedLanguage === "fr" ? "Français" : "English"}
                </Text>
                <ChevronRightIcon size={18} color="#6B7280" />
              </View>
            </Pressable>

            {/* Currency → navigates to settings page */}
            <Pressable
              onPress={goCurrency}
              className="flex-row items-center justify-between py-1 border-t border-gray-100 pt-3"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <CurrencyIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Currency
                </Text>
              </View>
              <View className="flex-row items-center gap-x-1.5">
                <Text
                  allowFontScaling={false}
                  className="font-medium text-[15px] text-zeno-text-secondary"
                >
                  {selectedCurrency}
                </Text>
                <ChevronRightIcon size={18} color="#6B7280" />
              </View>
            </Pressable>

            {/* Notifications → navigates to settings page */}
            <Pressable
              onPress={goNotifications}
              className="flex-row items-center justify-between py-1 border-t border-gray-100 pt-3"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <BellOutlineIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Notifications
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Security → navigates to settings page */}
            <Pressable
              onPress={goSecurity}
              className="flex-row items-center justify-between py-1 border-t border-gray-100 pt-3"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <ShieldOutlineIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Security
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* Support → navigates to settings page */}
            <Pressable
              onPress={goSupport}
              className="flex-row items-center justify-between py-1 border-t border-gray-100 pt-3"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <SupportIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Support
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>

            {/* About ZENO → navigates to settings page */}
            <Pressable
              onPress={goAbout}
              className="flex-row items-center justify-between py-1 border-t border-gray-100 pt-3"
            >
              <View className="flex-row items-center">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                  <InfoIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  About ZENO
                </Text>
              </View>
              <ChevronRightIcon size={18} color="#6B7280" />
            </Pressable>
          </View>

          {/* Account Section */}
          <Text
            allowFontScaling={false}
            className="mt-6 mb-3 font-semibold text-[20px] text-zeno-text-primary"
          >
            Account
          </Text>

          <View className="rounded-[28px] bg-[#C6F03B] p-4 shadow-xs gap-y-4">
            {/* Delete Account */}
            <Pressable
              onPress={openDeleteAccount}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                  <SecurityLinkIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Delete Account
                </Text>
              </View>
            </Pressable>

            {/* Log Out */}
            <Pressable
              onPress={openLogout}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
                  <SecurityWalletIcon size={22} color="#071706" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="ml-3.5 font-semibold text-[17px] text-zeno-text-primary"
                >
                  Log Out
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Interactive Modals */}
      <EditProfileModal
        visible={isEditProfileVisible}
        onClose={() => setIsEditProfileVisible(false)}
      />
      {kycStatus !== "verified" ? (
        <KycModal
          visible={isKycVisible}
          onClose={() => setIsKycVisible(false)}
          status={kycStatus}
          countryId={kycCountryId}
          onStatusChange={(status) => {
            if (status === "pending") setSubmittedKycPending(true);
            if (status === "verified") setIsKycVisible(false);
          }}
        />
      ) : null}

      {/* Account Modals */}
      <DeleteAccountModal
        visible={isDeleteAccountVisible}
        onClose={() => setIsDeleteAccountVisible(false)}
      />
      <LogoutModal
        visible={isLogoutVisible}
        onClose={() => setIsLogoutVisible(false)}
      />

      {/* Floating Liquid Glass Navigation Bar (3 Main Tabs) */}
      <FloatingGlassNavBar activeTab="profile" />
    </View>
  );
}




