import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Dismisses the in-app browser left open after an OAuth redirect. Without this
 * the auth session stays alive and the browser view never closes on its own.
 *
 * warmUpAsync / coolDownAsync are native-only APIs — they do not exist on web.
 * We guard with Platform.OS so the hook is safe to call on every platform.
 */
export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);
}
