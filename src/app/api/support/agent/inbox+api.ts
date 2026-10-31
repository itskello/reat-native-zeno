import { getSupportAgentAuth, getSupportStream, json, supportChannelData } from "@/lib/server/support-chat";
import { rateLimit } from "@/lib/server/rate-limit";
import type { ChannelFilters } from "stream-chat";

/** Staff-only inbox for conversations waiting for a ZENO agent. */
export async function GET(request: Request) {
  const auth = await getSupportAgentAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`support:agent-inbox:${auth.userId}`, 60, 60);
  if (!limit.allowed) return json({ error: "Trop de demandes. Réessaie dans un instant." }, 429, limit.retryAfter);

  const stream = getSupportStream();
  if (!stream) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    const filters = { type: "messaging", support_kind: "customer_support", support_status: { $in: ["waiting", "human"] } } as ChannelFilters;
    const channels = await stream.queryChannels(
      filters,
      { last_message_at: -1 },
      { limit: 50, state: true, watch: false },
    );
    return json({ conversations: channels.flatMap((channel) => {
      const data = supportChannelData(channel);
      if (typeof channel.id !== "string" || typeof data.customer_id !== "string") return [];
      const lastMessage = channel.state.messages[channel.state.messages.length - 1];
      return [{
        id: channel.id,
        customerId: data.customer_id,
        customerName: typeof data.customer_name === "string" ? data.customer_name : "ZENO User",
        status: typeof data.support_status === "string" ? data.support_status : "waiting",
        lastMessage: lastMessage?.text ?? "",
        updatedAt: lastMessage?.created_at ?? data.created_at ?? null,
      }];
    }) });
  } catch (cause) {
    console.error("[api/support/agent/inbox] Stream query failed:", cause);
    return json({ error: "Impossible de charger les conversations." }, 502);
  }
}

export async function POST(request: Request) {
  const auth = await getSupportAgentAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => null) as { channelId?: unknown } | null;
  const channelId = typeof body?.channelId === "string" ? body.channelId.trim() : "";
  if (!/^customer_[a-z0-9_-]{1,80}$/.test(channelId)) return json({ error: "Conversation invalide." }, 400);

  const stream = getSupportStream();
  const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY?.trim();
  if (!stream || !apiKey) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    await stream.upsertUsers([{ id: auth.userId, name: auth.name }]);
    const channel = stream.channel("messaging", channelId);
    await channel.query({ state: false, messages: { limit: 0 } });
    const data = supportChannelData(channel);
    if (typeof data.customer_id !== "string" || data.support_kind !== "customer_support") return json({ error: "Conversation introuvable." }, 404);
    if (data.support_status === "human" && data.assigned_agent_id !== auth.userId) {
      return json({ error: "Cette conversation est déjà prise en charge par un autre agent." }, 409);
    }

    await channel.addMembers([auth.userId]);
    await channel.updatePartial({ set: { support_status: "human", assigned_agent_id: auth.userId } });
    return json({
      apiKey,
      token: stream.createToken(auth.userId, Math.floor(Date.now() / 1000) + 60 * 60),
      userId: auth.userId,
      userName: auth.name,
      channelId,
    });
  } catch (cause) {
    console.error("[api/support/agent/inbox] Could not claim conversation:", cause);
    return json({ error: "Impossible d’ouvrir cette conversation." }, 502);
  }
}
