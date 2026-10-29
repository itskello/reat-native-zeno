import { ArrowRightIcon, NoConversationsIcon } from "@/components/ui/ProfileIcons";
import { images } from "@/constants/images";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Support Messages Screen
 *
 * Displays the list of past support conversations.
 * Shows the empty state (matching design screenshot) with a premium SVG illustration.
 * In production: connect to Stream Chat or support backend for real threads.
 */
export default function SupportMessagesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center gap-x-4 pt-3 pb-2">
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
            className="text-[22px] font-bold text-zeno-text-primary"
          >
            Messages
          </Text>
        </View>

        {/* Empty State — centered vertically */}
        <View className="flex-1 items-center justify-center pb-20">
          {/* Premium SVG illustration */}
          <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-100 mb-5">
            <NoConversationsIcon size={56} color="#9CA3AF" />
          </View>

          <Text
            allowFontScaling={false}
            className="text-[20px] font-bold text-zeno-text-primary mb-2"
          >
            Aucune conversation
          </Text>
          <Text
            allowFontScaling={false}
            className="text-[14px] font-medium text-zeno-text-secondary text-center leading-[22px] px-6"
          >
            Les conversations avec l'équipe{"\n"}s'afficheront ici
          </Text>

          {/* CTA button */}
          <Pressable
            onPress={() => router.push("/settings/support-chat")}
            className="mt-8 h-[52px] flex-row items-center justify-center rounded-full bg-[#0A1712] px-8 gap-x-3 shadow-md"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <Text
              allowFontScaling={false}
              className="text-[16px] font-bold text-white"
            >
              Contacter l'assistance
            </Text>
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
