import * as LocalAuthentication from "expo-local-authentication";

/**
 * Thin wrapper around Expo's native biometric APIs.
 *
 * ZENO only uses biometrics as a *local* convenience gate (faster login,
 * approving payments) — it never authenticates the user against the backend by
 * itself. The backend remains the source of truth for every financial action.
 * Nothing biometric (no template, no scan) ever leaves the device: the OS keeps
 * the fingerprint/face data in secure hardware and only returns a yes/no.
 */

export type BiometricResult =
  | { success: true }
  | { success: false; reason: "unavailable" | "cancelled" | "failed" };

/**
 * Whether the device has biometric hardware AND at least one biometric
 * enrolled (a registered fingerprint/face). Both must be true to prompt.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

/**
 * Trigger the native biometric prompt (Touch ID / Face ID / fingerprint).
 * Returns a discriminated result so callers can show the right message
 * without inspecting Expo's raw error strings.
 */
export async function authenticateWithBiometrics(
  promptMessage: string
): Promise<BiometricResult> {
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, reason: "unavailable" };
  }

  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      // Keep the flow inside ZENO: don't offer the device passcode as a
      // fallback here, since this step is specifically enrolling biometrics.
      disableDeviceFallback: true,
      cancelLabel: "Cancel",
    });

    if (result.success) {
      return { success: true };
    }

    // Expo reports user cancellation via specific error codes.
    const cancelled =
      result.error === "user_cancel" ||
      result.error === "system_cancel" ||
      result.error === "app_cancel";

    return { success: false, reason: cancelled ? "cancelled" : "failed" };
  } catch {
    return { success: false, reason: "failed" };
  }
}
