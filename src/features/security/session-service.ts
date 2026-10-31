import { deleteAuthenticated, getAuthenticated, postAuthenticated } from "@/lib/api";

export type DeviceSession = {
  id: string;
  isCurrent: boolean;
  deviceName: string | null;
  platform: "ios" | "android" | "web" | null;
  osName: string | null;
  osVersion: string | null;
  browserName: string | null;
  deviceType: string | null;
  isMobile: boolean;
  lastActiveAt: number;
};

export type CurrentDeviceInfo = {
  deviceName: string;
  platform: "ios" | "android" | "web";
  osName: string | null;
  osVersion: string | null;
};

export async function getDeviceSessions(token: string, signal?: AbortSignal) {
  return getAuthenticated<{ sessions: DeviceSession[] }>("/api/security/sessions", token, signal);
}

export async function registerCurrentDevice(token: string, device: CurrentDeviceInfo) {
  return postAuthenticated<{ registered: true }>("/api/security/sessions", token, device);
}

export async function revokeDeviceSession(token: string, sessionId: string) {
  return deleteAuthenticated<{ revoked: true }>(
    `/api/security/sessions?sessionId=${encodeURIComponent(sessionId)}`,
    token,
  );
}
