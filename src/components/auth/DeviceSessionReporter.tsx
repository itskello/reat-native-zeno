import { registerCurrentDevice } from "@/features/security/session-service";
import { useAuth } from "@clerk/expo";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

export function DeviceSessionReporter() {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId) return;
    let cancelled = false;

    const report = async () => {
      const storageKey = `zeno_device_registered_${sessionId}`;
      try {
        const alreadyRegistered = Platform.OS === "web"
          ? localStorage.getItem(storageKey)
          : await SecureStore.getItemAsync(storageKey);
        if (alreadyRegistered) return;
        const token = await getTokenRef.current();
        if (!token || cancelled) return;

        const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
        const deviceName = Device.modelName || Device.deviceName || (platform === "web" ? "Web browser" : "Mobile device");
        const osName = platform === "ios" ? "iOS" : platform === "android" ? "Android" : Device.osName;
        const result = await registerCurrentDevice(token, {
          deviceName,
          platform,
          osName,
          osVersion: Device.osVersion,
        });
        if (result.ok && !cancelled) {
          if (Platform.OS === "web") localStorage.setItem(storageKey, "1");
          else await SecureStore.setItemAsync(storageKey, "1");
        }
      } catch {
        // Session details are non-critical; a later app launch can retry registration.
      }
    };

    void report();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, sessionId]);

  return null;
}
