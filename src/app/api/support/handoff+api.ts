import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { findOwnedSupportChannel, getSupportStream } from "@/lib/server/support-chat";

/** Marks the existing support thread for human follow-up; messages stay in place. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`support:handoff:${auth.userId}`, 5, 60);
  if (!limit.allowed) return json({ error: "Attends un instant avant de refaire cette demande." }, 429, limit.retryAfter);

  const stream = getSupportStream();
  if (!stream) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    const body = await request.json().catch(() => ({})) as { channelId?: unknown };
    if (typeof body.channelId !== "string") return json({ error: "Conversation introuvable." }, 404);
    const channel = await findOwnedSupportChannel(stream, auth.userId, body.channelId);
    if (!channel) return json({ error: "Conversation introuvable." }, 404);

    await channel.updatePartial({ set: { support_status: "waiting", assigned_agent_id: "" } });
    return json({ status: "waiting" });
  } catch (cause) {
    console.error("[api/support/handoff] Stream update failed:", cause);
    return json({ error: "Impossible de prévenir l’équipe pour le moment." }, 502);
  }
}
