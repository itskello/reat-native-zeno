import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useWalletNav } from "@/store/wallet-nav";

type TabId = "home" | "transactions" | "profile";

interface FloatingGlassNavBarProps {
  activeTab?: TabId;
}

export function FloatingGlassNavBar({ activeTab }: FloatingGlassNavBarProps) {
  const insets = useSafeAreaInsets();
  const currentWalletScreen = useWalletNav((s) => s.current);
  const navigateTo = useWalletNav((s) => s.navigateTo);
  const goHome = useWalletNav((s) => s.goHome);

  // The wallet has a single route; its room store determines the selected tab.
  // Profile passes its tab explicitly so this shared bar does not need to read
  // Expo Router navigation context while wallet surfaces are being presented.
  const derivedTab: TabId = React.useMemo(() => {
    if (activeTab) return activeTab;
    if (currentWalletScreen === "TRANSACTIONS") return "transactions";
    return "home";
  }, [activeTab, currentWalletScreen]);

  const handleTabPress = useCallback((tab: TabId) => {
    if (tab === "home") {
      // Always reset the wallet room first — otherwise returning from profile/settings
      // would land on whichever room was last open (e.g. TRANSACTIONS).
      goHome();
      if (activeTab === "profile") {
        router.replace("/wallet");
      }
    } else if (tab === "transactions") {
      if (activeTab === "profile") {
        router.replace("/wallet");
      }
      // Schedule navigateTo after potential replace settles
      navigateTo("TRANSACTIONS");
    } else if (tab === "profile") {
      router.push("/profile");
    }
  }, [activeTab, goHome, navigateTo]);

  const pressHome = useCallback(() => handleTabPress("home"), [handleTabPress]);
  const pressTransactions = useCallback(() => handleTabPress("transactions"), [handleTabPress]);
  const pressProfile = useCallback(() => handleTabPress("profile"), [handleTabPress]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 bottom-0 bg-white/95 border-t border-gray-100"
      style={{
        zIndex: 100,
        elevation: 100,
        paddingBottom: Math.max(insets.bottom, 12),
      }}
    >
      {/* Full-width iPhone Glass Footer Bar */}
      <View className="flex-row items-center justify-around h-[58px] px-2">
        {/* Home / Accueil Tab */}
        <TabButton
          label="Accueil"
          isActive={derivedTab === "home"}
          onPress={pressHome}
          icon={
            <HomeIcon
              size={24}
              color={derivedTab === "home" ? "#071706" : "#9CA3AF"}
              filled={derivedTab === "home"}
            />
          }
        />

        {/* Transactions / Cartes Tab */}
        <TabButton
          label="Transactions"
          isActive={derivedTab === "transactions"}
          onPress={pressTransactions}
          icon={
            <CardIcon
              size={24}
              color={derivedTab === "transactions" ? "#071706" : "#9CA3AF"}
              filled={derivedTab === "transactions"}
            />
          }
        />

        {/* Profile / Paramètres Tab */}
        <TabButton
          label="Paramètres"
          isActive={derivedTab === "profile"}
          onPress={pressProfile}
          icon={
            <ProfileIcon
              size={24}
              color={derivedTab === "profile" ? "#071706" : "#9CA3AF"}
              filled={derivedTab === "profile"}
            />
          }
        />
      </View>
    </View>
  );
}

const TabButton = React.memo(function TabButton({
  label,
  isActive,
  onPress,
  icon,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="flex-1 items-center justify-center py-1"
    >
      <View className="items-center justify-center">{icon}</View>
      <Text
        allowFontScaling={false}
        className={`mt-1 text-[12px] ${
          isActive
            ? "font-bold text-[#071706]"
            : "font-medium text-[#9CA3AF]"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
});

function HomeIcon({
  size = 24,
  color = "#9CA3AF",
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.182V20a1 1 0 001 1h5a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h5a1 1 0 001-1v-9.818a1.5 1.5 0 00-.496-1.114l-7.5-6.818a1.5 1.5 0 00-2.008 0l-7.5 6.818A1.5 1.5 0 003 10.182z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={filled ? "0" : "2"}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CardIcon({
  size = 24,
  color = "#9CA3AF",
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke={color}
        strokeWidth="2"
        fill={filled ? color : "none"}
      />
      <Path
        d="M3 10h18"
        stroke={filled ? "#FFFFFF" : color}
        strokeWidth="2"
      />
      <Path
        d="M7 15h4"
        stroke={filled ? "#FFFFFF" : color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ProfileIcon({
  size = 24,
  color = "#9CA3AF",
  filled = false,
}: {
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Circle
        cx="12"
        cy="9.5"
        r="3"
        stroke={color}
        strokeWidth="2"
        fill={filled ? color : "none"}
      />
      <Path
        d="M6.5 18a6 6 0 0111 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}
