import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { choosePrimarySupportChannel, findOwnedSupportChannel, getSupportStream, listOwnedSupportChannels, supportChannelData, supportChannelId, ZENO_ASSISTANT_USER_ID } from "@/lib/server/support-chat";

/** Returns the customer's one active support thread without creating a channel. */
export async function GET(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const stream = getSupportStream();
  if (!stream) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    const channels = await listOwnedSupportChannels(stream, auth.userId, 1);
    const channel = choosePrimarySupportChannel(channels, auth.userId);
    if (!channel) return json({ conversation: null });
    const data = supportChannelData(channel);
    const latest = channel.state.messages[channel.state.messages.length - 1];
    return json({ conversation: {
      id: channel.id,
      status: data.support_status === "human" ? "human" : data.support_status === "waiting" ? "waiting" : "ai",
      lastMessage: latest?.text ?? "",
      lastMessageSender: !latest?.user?.id ? null : latest.user.id === ZENO_ASSISTANT_USER_ID ? "assistant" : latest.user.id === auth.userId ? "customer" : "agent",
      updatedAt: latest?.created_at ?? data.created_at ?? null,
    } });
  } catch (cause) {
    console.error("[api/support/conversation] Stream summary failed:", cause);
    return json({ error: "Impossible de charger la conversation." }, 502);
  }
}

/** Resumes the customer's one support thread, creating it only on first contact. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`support:conversation:${auth.userId}`, 20, 60);
  if (!limit.allowed) return json({ error: "Trop de demandes. Réessaie dans un instant." }, 429, limit.retryAfter);

  const stream = getSupportStream();
  const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY?.trim();
  if (!stream || !apiKey) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    let body: { conversationId?: unknown };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    if (body.conversationId !== undefined && (typeof body.conversationId !== "string" || body.conversationId.length > 128)) {
      return json({ error: "Conversation invalide." }, 400);
    }

    let channel;
    let userName: string | undefined;
    if (typeof body.conversationId === "string") {
      const owned = await findOwnedSupportChannel(stream, auth.userId, body.conversationId);
      if (!owned) return json({ error: "Conversation introuvable." }, 404);
      channel = owned;
    } else {
      // Most users have the canonical single thread. Look it up directly so
      // reopening chat does not scan every support channel on each launch.
      const canonical = await findOwnedSupportChannel(stream, auth.userId, supportChannelId(auth.userId));
      const existing = canonical ?? choosePrimarySupportChannel(await listOwnedSupportChannels(stream, auth.userId, 0), auth.userId);
      if (existing) {
        channel = existing;
        const storedName = supportChannelData(channel).customer_name;
        userName = typeof storedName === "string" && storedName.trim() ? storedName : undefined;
        if (supportChannelData(channel).support_primary !== true) {
          await channel.updatePartial({ set: { support_primary: true } });
        }
      } else {
        const clerkUser = await auth.clerk.users.getUser(auth.userId);
        const name = clerkUser.fullName || clerkUser.username || "ZENO User";
        userName = name;
        await stream.upsertUsers([{ id: auth.userId, name }, { id: ZENO_ASSISTANT_USER_ID, name: "ZENO Assistant" }]);
        const channelId = supportChannelId(auth.userId);
        channel = stream.channel("messaging", channelId, {
          created_by_id: auth.userId,
          members: [auth.userId, ZENO_ASSISTANT_USER_ID],
          support_kind: "customer_support",
          support_primary: true,
          customer_id: auth.userId,
          customer_name: name,
          support_status: "ai",
        });
        await channel.create({ created_by_id: auth.userId });
      }
    }

    // Keep the assistant participant attached to the same thread. This is a
    // no-op for normal channels and only makes extra Stream calls for a legacy
    // channel that was created before the assistant member was added.
    if (!Object.keys(channel.state.members ?? {}).includes(ZENO_ASSISTANT_USER_ID)) {
      await stream.upsertUsers([{ id: ZENO_ASSISTANT_USER_ID, name: "ZENO Assistant" }]);
      await channel.addMembers([ZENO_ASSISTANT_USER_ID]);
    }

    const token = stream.createToken(auth.userId, Math.floor(Date.now() / 1000) + 60 * 60);

    const channelData = supportChannelData(channel);
    return json({
      apiKey,
      token,
      userId: auth.userId,
      ...(userName ? { userName } : {}),
      channelId: channel.id,
      status: channelData.support_status === "human" ? "human" : channelData.support_status === "waiting" ? "waiting" : "ai",
    });
  } catch (cause) {
    console.error("[api/support/conversation] Stream setup failed:", cause);
    return json({ error: "Impossible d’ouvrir la conversation d’assistance pour le moment." }, 502);
  }
}
