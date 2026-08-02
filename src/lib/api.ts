/**
 * Thin client for ZENO's own API routes (Expo Router `+api.ts` handlers).
 *
 * These are OUR endpoints, not a financial partner's — no secret is involved,
 * so calling them from the app is correct. Secrets (SMS gateway keys, the OTP
 * signing secret) stay behind the routes in `src/lib/server/`.
 */
import Constants from "expo-constants";

/**
 * Resolves the base URL of the API routes.
 *
 * - Production: a single origin serves both the app and its API, so an empty
 *   base (relative path) is correct.
 * - Development: the app runs on a phone that cannot resolve "localhost". The
 *   Metro bundler already knows the dev machine's LAN address, so we reuse it
 *   automatically — no more hand-editing an IP in .env every time the network
 *   changes. An explicit EXPO_PUBLIC_API_URL still wins when set (e.g. a tunnel
 *   or a separate backend host).
 */
function resolveBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  if (!__DEV__) {
    return "";
  }

  // hostUri looks like "192.168.60.240:8081"; keep the host, force http.
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Older/edge cases expose it under expoGoConfig instead.
    (Constants as { expoGoConfig?: { hostUri?: string } }).expoGoConfig
      ?.hostUri;

  const host = hostUri?.split(":")[0];
  if (host) {
    return `http://${host}:8081`;
  }

  // Last resort: relative path (works on web, fails loudly on device so the
  // misconfiguration is obvious rather than silent).
  return "";
}

const rawBaseUrl = resolveBaseUrl();

function endpoint(path: string) {
  return `${rawBaseUrl}${path}`;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const response = await fetch(endpoint(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!response.ok) {
      const error =
        typeof payload.error === "string"
          ? payload.error
          : "Something went wrong. Please try again.";

      // In development the server appends a `detail` field with the real cause.
      const detail =
        typeof payload.detail === "string" ? ` (${payload.detail})` : "";

      return { ok: false, error: `${error}${detail}` };
    }

    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      error: "We could not reach ZENO. Check your connection and try again.",
    };
  }
}

export function requestPhoneOtp(phone: string) {
  return post<{ token: string; expiresAt: number }>("/api/otp/send", { phone });
}

export function verifyPhoneOtp(input: {
  phone: string;
  token: string;
  code: string;
}) {
  return post<{ verified: true }>("/api/otp/verify", input);
}
