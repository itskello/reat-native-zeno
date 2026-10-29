import { useUser } from "@clerk/clerk-expo";
import {
  ArrowRightIcon,
  HelpCircleIcon,
  MessageChatIcon,
  SearchIcon,
} from "@/components/ui/ProfileIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { images } from "@/constants/images";
import Svg, { Path } from "react-native-svg";

/** Close icon inline (X) */
function XIcon({ size = 16, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type MenuItem = {
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  route: "/settings/support-help" | "/settings/support-messages" | "/settings/support-chat";
};

const MENU_ITEMS: MenuItem[] = [
  { label: "Aide", Icon: HelpCircleIcon, route: "/settings/support-help" },
  { label: "Messages", Icon: MessageChatIcon, route: "/settings/support-messages" },
  { label: "Trouver une réponse", Icon: SearchIcon, route: "/settings/support-help" },
  { label: "Contacter l'assistance", Icon: ArrowRightIcon, route: "/settings/support-chat" },
];

/**
 * Support Home Screen
 *
 * Entry point for the Help & Support centre.
 */
export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const firstName = user?.firstName || "là";

  return (
    <View className="flex-1 bg-[#F4FAFF]">
      {/* ── Hero (dark green) ─────────────────────────────── */}
      <View
        className="bg-[#0A1712]"
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 36,
          paddingHorizontal: 20,
        }}
      >
        {/* Top bar: logo + close */}
        <View className="flex-row items-center justify-between mb-9">
          <Image
            source={images.logoWhite}
            style={{ width: 44, height: 28 }}
            contentFit="contain"
          />
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <XIcon size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text
          allowFontScaling={false}
          className="text-[28px] font-bold text-white leading-[38px]"
        >
          {"Hello "}
          {firstName}
          {" 👋\nComment pouvons-nous\nt'aider ?"}
        </Text>
      </View>

      {/* ── Navigation Cards ──────────────────────────────── */}
      <View className="px-5 -mt-5">
        <View className="overflow-hidden rounded-[28px] bg-white shadow-low border border-gray-100/60">
          {MENU_ITEMS.map((item, i) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route)}
              className={`flex-row items-center justify-between px-5 py-[18px] ${
                i > 0 ? "border-t border-gray-100" : ""
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <Text
                allowFontScaling={false}
                className="text-[16px] font-semibold text-zeno-text-primary"
              >
                {item.label}
              </Text>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-[#E8F5EE]">
                <item.Icon size={20} color="#0F7153" />
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
