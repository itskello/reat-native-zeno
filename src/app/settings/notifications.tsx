import { images } from "@/constants/images";
import { SettingsSkeleton } from "@/components/ui/Skeleton";
import { useInitialLoading } from "@/lib/useInitialLoading";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const isInitialLoading = useInitialLoading(300);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);

  const handlePushToggle = async (value: boolean) => {
    if (value) {
      // In production: request push notification permissions
      setPushEnabled(true);
      Alert.alert(
        "Notifications activées",
        "Vous recevrez des notifications push de ZENO."
      );
    } else {
      Alert.alert(
        "Désactiver les notifications",
        "Êtes-vous sûr de vouloir désactiver toutes les notifications push ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Désactiver",
            style: "destructive",
            onPress: () => {
              setPushEnabled(false);
              // When push is disabled, disable all sub-options
              setTransactionAlerts(false);
              setPromotions(false);
              setSecurityAlerts(false);
              setReminders(false);
              setProductUpdates(false);
            },
          },
        ]
      );
    }
  };

  // Individual toggles re-enable push if needed
  const handleSubToggle = (
    setter: (val: boolean) => void,
    value: boolean,
    name: string
  ) => {
    if (value && !pushEnabled) {
      // Auto-enable push when any sub-option is enabled
      setPushEnabled(true);
    }
    setter(value);
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 bg-[#F4FAFF]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <SettingsSkeleton rows={6} />
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
            Notifications
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 32 }}
          className="mt-6"
        >
          {/* Main Push Toggle Card */}
          <View className="flex-row items-center justify-between rounded-[28px] bg-white p-5 shadow-xs">
            <View className="flex-1 pr-4">
              <Text
                allowFontScaling={false}
                className="font-bold text-[18px] text-zeno-text-primary"
              >
                Push Notifications
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-1 font-medium text-[14px] text-zeno-text-secondary leading-[20px]"
              >
                Manage how you receive notifications.
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Section Sub-header */}
          <Text
            allowFontScaling={false}
            className="mt-6 mb-3 font-semibold text-[18px] text-zeno-text-primary"
          >
            Notification Preferences
          </Text>

          {/* Notification Options Card */}
          <View className="rounded-[28px] bg-white p-4 shadow-xs gap-y-4">
            {/* Transaction Alerts */}
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Transaction Alerts
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Sent and received money
                </Text>
              </View>
              <Switch
                value={transactionAlerts}
                onValueChange={(val) =>
                  handleSubToggle(setTransactionAlerts, val, "Transaction Alerts")
                }
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Promotions */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Promotions
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Offers and discounts
                </Text>
              </View>
              <Switch
                value={promotions}
                onValueChange={(val) =>
                  handleSubToggle(setPromotions, val, "Promotions")
                }
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Security Alerts */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Security Alerts
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Login, password, and more
                </Text>
              </View>
              <Switch
                value={securityAlerts}
                onValueChange={(val) =>
                  handleSubToggle(setSecurityAlerts, val, "Security Alerts")
                }
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Reminders */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Reminders
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  Bills, payments, and more
                </Text>
              </View>
              <Switch
                value={reminders}
                onValueChange={(val) =>
                  handleSubToggle(setReminders, val, "Reminders")
                }
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Product Updates */}
            <View className="flex-row items-center justify-between py-2 border-t border-gray-100 pt-4">
              <View className="flex-1 pr-3">
                <Text
                  allowFontScaling={false}
                  className="font-semibold text-[17px] text-zeno-text-primary"
                >
                  Product Updates
                </Text>
                <Text
                  allowFontScaling={false}
                  className="mt-0.5 text-[13px] text-zeno-text-secondary"
                >
                  New features and updates
                </Text>
              </View>
              <Switch
                value={productUpdates}
                onValueChange={(val) =>
                  handleSubToggle(setProductUpdates, val, "Product Updates")
                }
                trackColor={{ false: "#E5E7EB", true: "#70DF00" }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

