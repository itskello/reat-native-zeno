import { StreamChat, type Channel } from "stream-chat";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";

let cachedClient: { apiKey: string; client: StreamChat } | null = null;

export const ZENO_ASSISTANT_USER_ID = "zeno_gemini_assistant";

export function supportChannelId(userId: string) {
  const safeId = userId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `customer_${safeId}`;
}

export function getSupportStream() {
  const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY?.trim();
  const apiSecret = process.env.STREAM_API_SECRET?.trim();

  if (!apiKey || !apiSecret) return null;
  if (cachedClient?.apiKey === apiKey) return cachedClient.client;

  const client = StreamChat.getInstance(apiKey, apiSecret);
  cachedClient = { apiKey, client };
  return client;
}

export function createSupportChannelId(userId: string) {
  const safeId = userId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const uniqueSuffix = globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `support_${safeId}_${uniqueSuffix}`;
}

/** Finds a channel by CID without creating it, then confirms its owner. */
export async function findOwnedSupportChannel(stream: StreamChat, userId: string, channelId: string, messageLimit = 0) {
  if (!channelId || channelId.length > 128) return null;
  const [channel] = await stream.queryChannels(
    { cid: `messaging:${channelId}` },
    [],
    { limit: 1, state: true, message_limit: messageLimit },
  );
  const data = channel ? supportChannelData(channel) : null;
  if (!channel || data?.customer_id !== userId || data.support_kind !== "customer_support") return null;
  return channel;
}

export function supportChannelData(channel: Channel): Record<string, unknown> {
  return (channel.data ?? {}) as Record<string, unknown>;
}

export async function listOwnedSupportChannels(stream: StreamChat, userId: string, messageLimit = 1) {
  const channels = await stream.queryChannels(
    { type: "messaging", customer_id: userId, support_kind: "customer_support" },
    [{ last_message_at: -1 }],
    { limit: 50, state: true, message_limit: messageLimit },
  );
  return channels.filter((channel) => {
    const data = supportChannelData(channel);
    return data.customer_id === userId && data.support_kind === "customer_support";
  });
}

export function choosePrimarySupportChannel(channels: Channel[], userId: string) {
  return channels.find((channel) => supportChannelData(channel).support_primary === true)
    ?? channels.find((channel) => channel.id === supportChannelId(userId))
    ?? channels[0]
    ?? null;
}

export async function getSupportAgentAuth(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return auth;

  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    if (user.privateMetadata.supportRole !== "agent") {
      return { ok: false as const, status: 403, error: "Accès réservé à l’équipe ZENO." };
    }
    return { ...auth, ok: true as const, name: user.fullName || user.username || "ZENO Agent" };
  } catch {
    return { ok: false as const, status: 502, error: "Impossible de vérifier l’accès agent." };
  }
}

export { json };
