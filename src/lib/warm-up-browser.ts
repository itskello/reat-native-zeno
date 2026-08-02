import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

/**
 * Dismisses the in-app browser left open after an OAuth redirect. Without this
 * the auth session stays alive and the browser view never closes on its own.
 */
export function useWarmUpBrowser() {
  useEffect(() => {
    WebBrowser.warmUpAsync();
    return () => {
      WebBrowser.coolDownAsync();
    };
  }, []);
}

WebBrowser.maybeCompleteAuthSession();
