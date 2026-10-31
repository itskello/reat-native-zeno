/**
 * Push permissions are temporarily disabled while ZENO is developed without a
 * native development build. Keep this small interface so the settings screen
 * can be reconnected when push notifications are re-enabled.
 */
export type NotificationPermissionState = {
  enabled: boolean;
  canAskAgain: boolean;
  available: boolean;
};

const unavailable: NotificationPermissionState = {
  enabled: false,
  canAskAgain: false,
  available: false,
};

export async function getNotificationPermissionState(): Promise<NotificationPermissionState> {
  return unavailable;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  return unavailable;
}

export async function openNotificationSettings(): Promise<void> {
  // No native notification permission is registered while the feature is off.
}
