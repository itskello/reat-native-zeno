import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";

const DEVICE_METADATA_KEY = "zenoDeviceSessions";
const MAX_STORED_DEVICES = 20;

type DeviceSnapshot = {
  deviceName: string;
  platform: "ios" | "android" | "web";
  osName: string | null;
  osVersion: string | null;
  updatedAt: number;
};

export async function GET(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`security:sessions:list:${auth.userId}`, 60, 60);
  if (!limit.allowed) return json({ error: "Trop de demandes. Réessaie dans un instant." }, 429, limit.retryAfter);

  try {
    const [result, user] = await Promise.all([
      auth.clerk.sessions.getSessionList({
        userId: auth.userId,
        status: "active",
        limit: 30,
      }),
      auth.clerk.users.getUser(auth.userId),
    ]);
    const deviceSnapshots = readDeviceSnapshots(user.privateMetadata[DEVICE_METADATA_KEY]);

    return json({
      sessions: result.data.map((session) => ({
        id: session.id,
        isCurrent: session.id === auth.sessionId,
        deviceName: deviceSnapshots[session.id]?.deviceName ?? null,
        platform: deviceSnapshots[session.id]?.platform ?? null,
        osName: deviceSnapshots[session.id]?.osName ?? null,
        osVersion: deviceSnapshots[session.id]?.osVersion ?? null,
        browserName: session.latestActivity?.browserName ?? null,
        deviceType: session.latestActivity?.deviceType ?? null,
        isMobile: session.latestActivity?.isMobile ?? false,
        lastActiveAt: session.lastActiveAt,
      })),
    });
  } catch (cause) {
    console.error("[api/security/sessions] Failed to load sessions:", cause);
    return json({ error: "Impossible de charger les appareils pour le moment." }, 502);
  }
}

/** Store the model reported by this signed-in app session; Clerk does not expose phone models. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`security:sessions:register:${auth.sessionId}`, 10, 60);
  if (!limit.allowed) return json({ error: "Trop de demandes. Réessaie dans un instant." }, 429, limit.retryAfter);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const deviceName = safeText(body?.deviceName, 80);
  const platform = body?.platform;
  if (!deviceName || (platform !== "ios" && platform !== "android" && platform !== "web")) {
    return json({ error: "Les informations de cet appareil sont invalides." }, 400);
  }

  const snapshot: DeviceSnapshot = {
    deviceName,
    platform,
    osName: safeText(body?.osName, 40) || null,
    osVersion: safeText(body?.osVersion, 40) || null,
    updatedAt: Date.now(),
  };

  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    const snapshots = readDeviceSnapshots(user.privateMetadata[DEVICE_METADATA_KEY]);
    snapshots[auth.sessionId] = snapshot;
    const trimmedSnapshots = Object.fromEntries(
      Object.entries(snapshots)
        .sort(([, left], [, right]) => right.updatedAt - left.updatedAt)
        .slice(0, MAX_STORED_DEVICES),
    );
    await auth.clerk.users.updateUserMetadata(auth.userId, {
      privateMetadata: { [DEVICE_METADATA_KEY]: trimmedSnapshots },
    });
    return json({ registered: true });
  } catch (cause) {
    console.error("[api/security/sessions] Failed to register device info:", cause);
    return json({ error: "Impossible d’enregistrer cet appareil pour le moment." }, 502);
  }
}

export async function DELETE(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`security:sessions:revoke:${auth.userId}`, 20, 60);
  if (!limit.allowed) return json({ error: "Trop d’actions. Réessaie dans un instant." }, 429, limit.retryAfter);

  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim() ?? "";
  if (!sessionId || sessionId.length > 128) return json({ error: "Session invalide." }, 400);
  if (sessionId === auth.sessionId) return json({ error: "Tu ne peux pas déconnecter cet appareil depuis sa session active." }, 400);

  try {
    const session = await auth.clerk.sessions.getSession(sessionId);
    if (session.userId !== auth.userId) return json({ error: "Appareil introuvable." }, 404);
    await auth.clerk.sessions.revokeSession(sessionId);
    return json({ revoked: true });
  } catch (cause) {
    console.error("[api/security/sessions] Failed to revoke session:", cause);
    return json({ error: "Impossible de déconnecter cet appareil pour le moment." }, 502);
  }
}

function readDeviceSnapshots(value: unknown): Record<string, DeviceSnapshot> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const snapshots: Record<string, DeviceSnapshot> = {};
  for (const [sessionId, candidate] of Object.entries(value)) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const item = candidate as Partial<DeviceSnapshot>;
    if (typeof item.deviceName !== "string" || typeof item.updatedAt !== "number") continue;
    if (item.platform !== "ios" && item.platform !== "android" && item.platform !== "web") continue;
    snapshots[sessionId] = {
      deviceName: item.deviceName,
      platform: item.platform,
      osName: typeof item.osName === "string" ? item.osName : null,
      osVersion: typeof item.osVersion === "string" ? item.osVersion : null,
      updatedAt: item.updatedAt,
    };
  }
  return snapshots;
}

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength)
    : "";
}
