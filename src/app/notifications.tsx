import { LocalizedText as Text } from "@/components/ui/LocalizedText";
import { useLanguageStore } from "@/store/language-store";
import { images } from "@/constants/images";
import { NotificationsSkeleton } from "@/components/ui/Skeleton";
import { ZenoLogoIcon } from "@/components/ui/ZenoLogoIcon";
import {
  useNotificationStore,
  type AppNotification,
} from "@/store/notification-store";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  Pressable,
  ScrollView,

  View} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Notification Inbox — shows all in-app notifications grouped into
 * "Unread" and "Earlier" sections, matching the reference design exactly.
 *
 * Opened from the bell icon on Wallet Home.
 * Uses standard Expo Router stack navigation (back button = router.back()).
 */
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const handlePress = useCallback(
    (notif: AppNotification) => {
      markRead(notif.id);
    },
    [markRead]
  );

  const isLoading = useInitialLoading(300);

  // Mark all as read when the user opens the screen (after skeleton fades)
  useEffect(() => {
    if (!isLoading) markAllRead();
  }, [isLoading, markAllRead]);

  if (isLoading) {
    return (
      <View
        className="flex-1 bg-[#F4FAFF]"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <NotificationsSkeleton />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-[#F4FAFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-5">
        {/* ── Header ── */}
        <View className="flex-row items-center justify-between pt-2">
          {/* Back button — same style as profile & transactions */}
          <Pressable
            className="h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white shadow-low"
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <Image
              source={images.back}
              style={{ width: 50, height: 50 }}
              contentFit="contain"
            />
          </Pressable>

          {/* Mark all read shortcut */}
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllRead}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text
                allowFontScaling={false}
                className="text-[14px] font-semibold text-[#0057FF]"
              >
                Tout marquer lu
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Page Title ── */}
        <Text
          allowFontScaling={false}
          className="mt-6 font-bold text-[32px] leading-[38px] text-zeno-text-primary"
        >
          Notifications
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          className="mt-5"
        >
          {/* ── Empty State ── */}
          {notifications.length === 0 && (
            <View className="mt-20 items-center justify-center">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-white shadow-low mb-4">
                <Text className="text-[36px]">🔔</Text>
              </View>
              <Text
                allowFontScaling={false}
                className="text-[18px] font-bold text-zeno-text-primary"
              >
                Aucune notification
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-2 text-[14px] font-medium text-zeno-text-secondary text-center px-6"
              >
                Vous n&apos;avez aucune notification pour le moment.
              </Text>
            </View>
          )}

          {/* ── Notification rows ── */}
          {notifications.map((notif, index) => (
            <NotificationRow
              key={notif.id}
              notification={notif}
              onPress={handlePress}
              isLast={index === notifications.length - 1}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── Notification Row ──────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onPress,
  isLast,
}: {
  notification: AppNotification;
  onPress: (n: AppNotification) => void;
  isLast: boolean;
}) {
  const language = useLanguageStore((state) => state.language);
  const timeLabel = new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(notification.createdAt));

  return (
    <Pressable
      onPress={() => onPress(notification)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <View className="flex-row items-start py-4">
        {/* ZENO Logo Icon — official brand mark with lime-green background */}
        <View className="mr-4 mt-0.5 flex-shrink-0 rounded-[14px] overflow-hidden">
          <ZenoLogoIcon size={48} />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Unread dot indicator */}
          {!notification.read && (
            <View className="absolute top-1 right-0 h-2 w-2 rounded-full bg-[#0057FF]" />
          )}

          <Text
            allowFontScaling={false}
            className="text-[14px] font-medium text-zeno-text-primary leading-[20px] pr-4"
          >
            {notification.message}
          </Text>

          <Text
            allowFontScaling={false}
            className="mt-2 text-[12px] font-medium text-zeno-text-secondary"
          >
            {timeLabel}
          </Text>
        </View>
      </View>

      {/* Divider — hidden for the last item */}
      {!isLast && <View className="h-[1px] bg-gray-200 ml-[64px]" />}
    </Pressable>
  );
}
