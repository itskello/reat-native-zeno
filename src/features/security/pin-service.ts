import { postAuthenticated } from "@/lib/api";

export function registerTransactionPin(sessionToken: string, pin: string, currentPin?: string) {
  return postAuthenticated<{ registered: true }>("/api/security/pin", sessionToken, {
    pin,
    ...(currentPin ? { currentPin } : {}),
  });
}
