import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { findOwnedSupportChannel, getSupportStream, supportChannelData, ZENO_ASSISTANT_USER_ID } from "@/lib/server/support-chat";
import { ZENO_ASSISTANT_SYSTEM_PROMPT } from "@/lib/server/support-assistant-prompt";

function redactSensitiveText(value: string) {
  return value
    .replace(/\b(?:pin|otp|cvv|cvc|verification code|security code|code(?:\s+de\s+(?:vérification|sécurité|validation))?)\s*(?:(?:is|est)\s*)?[:=]?\s*\d{3,8}\b/gi, "[sensitive code removed]")
    .replace(/\b(?:password|mot de passe)\s*(?::|=|is|est)\s*[^\s,;.!?]+/gi, "[password removed]")
    .replace(/\b(?:passport|passeport|identity card|carte d’identité|carte d'identité)\s*(?:(?:number|n°|no|numéro)\s*)?[:=#-]?\s*[A-Z0-9-]{5,}/gi, "[identity document detail removed]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[phone or account number removed]");
}

function assistantReply(payload: unknown) {
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates;
  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

/** Generates a safe general answer and posts it back into the user's Stream thread. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`support:assistant:${auth.userId}`, 12, 60);
  if (!limit.allowed) return json({ error: "Attends un instant avant d’envoyer un autre message." }, 429, limit.retryAfter);

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
  const tier = process.env.GEMINI_API_TIER?.trim().toLowerCase() || "free";
  if (!apiKey) return json({ error: "L’assistant n’est pas encore configuré." }, 503);
  // Google's free tier may use submitted content to improve its products. Keep
  // that tier for development only; production must explicitly use paid billing.
  if (process.env.NODE_ENV === "production" && tier !== "paid") {
    return json({ error: "L’assistant est temporairement indisponible." }, 503);
  }

  let body: { channelId?: unknown; messageId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Demande invalide." }, 400);
  }
  if (typeof body.channelId !== "string" || body.channelId.length > 128 || typeof body.messageId !== "string" || body.messageId.length > 128) {
    return json({ error: "Message invalide." }, 400);
  }

  const stream = getSupportStream();
  if (!stream) return json({ error: "Le chat d’assistance n’est pas encore configuré sur le serveur." }, 503);

  try {
    const channel = await findOwnedSupportChannel(stream, auth.userId, body.channelId, 30);
    if (!channel) return json({ error: "Conversation introuvable." }, 404);
    const channelData = supportChannelData(channel);
    if (channelData.customer_id !== auth.userId || channelData.support_kind !== "customer_support") {
      return json({ error: "Conversation introuvable." }, 404);
    }
    if (channelData.support_status !== "ai") return json({ handedOff: true });
    if (channelData.assistant_last_message_id === body.messageId) return json({ alreadyAnswered: true });

    const messages = channel.state.messages;
    const trigger = messages.find((message) => message.id === body.messageId);
    if (!trigger || trigger.user?.id !== auth.userId || !trigger.text?.trim()) {
      return json({ error: "Message introuvable." }, 404);
    }
    const memberIds = Object.keys(channel.state.members ?? {});
    if (!memberIds.includes(ZENO_ASSISTANT_USER_ID)) {
      await stream.upsertUsers([{ id: ZENO_ASSISTANT_USER_ID, name: "ZENO Assistant" }]);
      await channel.addMembers([ZENO_ASSISTANT_USER_ID]);
    }

    const context = messages.slice(-12).flatMap((message) => {
      if (!message.text?.trim() || (message.user?.id !== auth.userId && message.user?.id !== ZENO_ASSISTANT_USER_ID)) return [];
      return [{
        role: message.user.id === ZENO_ASSISTANT_USER_ID ? "model" : "user",
        parts: [{ text: redactSensitiveText(message.text).slice(0, 1600) }],
      }];
    });
    if (context[context.length - 1]?.role !== "user") return json({ handedOff: true });

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: ZENO_ASSISTANT_SYSTEM_PROMPT }] },
        contents: context,
        generationConfig: { temperature: 0.2, maxOutputTokens: 350 },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!geminiResponse.ok) {
      console.error("[api/support/assistant] Gemini request failed with status:", geminiResponse.status);
      return json({ error: "L’assistant est momentanément indisponible. Tu peux demander à parler à un agent." }, 502);
    }

    const reply = assistantReply(await geminiResponse.json());
    if (!reply) return json({ error: "L’assistant n’a pas pu préparer de réponse. Tu peux demander à parler à un agent." }, 502);

    if (reply === "[HANDOFF]") {
      const looksEnglish = /\b(i|the|my|please|how|what|when|help|cannot|can't|money|account|payment|card)\b/i.test(trigger.text);
      await channel.updatePartial({ set: { support_status: "waiting", assigned_agent_id: "" } });
      await channel.sendMessage({
        text: looksEnglish ? "I’m passing this to the ZENO team. An agent will reply in this conversation." : "Je transmets ta demande à l’équipe ZENO. Un agent te répondra dans cette conversation.",
        user_id: ZENO_ASSISTANT_USER_ID,
      });
      await channel.updatePartial({ set: { assistant_last_message_id: body.messageId } });
      return json({ handedOff: true });
    }

    await channel.sendMessage({ text: reply.slice(0, 4000), user_id: ZENO_ASSISTANT_USER_ID });
    await channel.updatePartial({ set: { assistant_last_message_id: body.messageId } });
    return json({ answered: true });
  } catch (cause) {
    console.error("[api/support/assistant] Reply processing failed:", cause);
    return json({ error: "L’assistant est momentanément indisponible. Tu peux demander à parler à un agent." }, 502);
  }
}
