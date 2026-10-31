import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json, recipientFromClerkUser } from "@/lib/server/recipients-auth";

const CONTACTS_KEY = "zenoContactIds";
const MAX_CONTACTS = 100;

export async function GET(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    const contactIds = readContactIds(user.privateMetadata[CONTACTS_KEY]);
    if (!contactIds.length) return json({ recipients: [] });

    const contacts = await auth.clerk.users.getUserList({ userId: contactIds, limit: MAX_CONTACTS });
    const byId = new Map(contacts.data.map((contact) => [contact.id, contact]));
    return json({
      recipients: contactIds.flatMap((id) => {
        const contact = byId.get(id);
        return contact ? [recipientFromClerkUser(contact)] : [];
      }),
    });
  } catch (cause) {
    console.error("[api/recipients] Failed to load contacts:", cause);
    return json({ error: "Impossible de charger tes contacts pour le moment." }, 502);
  }
}

export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`recipients:save:${auth.userId}`, 60, 60);
  if (!limit.allowed) return json({ error: "Trop d’actions. Réessaie dans un instant." }, 429, limit.retryAfter);

  const body = await request.json().catch(() => null) as { recipientId?: unknown; email?: unknown } | null;
  let recipientId = typeof body?.recipientId === "string" ? body.recipientId.trim() : "";
  if (!recipientId && typeof body?.email === "string") {
    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^\S+@\S+\.\S+$/.test(email)) return json({ error: "Adresse e-mail invalide." }, 400);
    try {
      const matches = await auth.clerk.users.getUserList({ emailAddress: [email], limit: 10 });
      const exactMatch = matches.data.find((user) => user.emailAddresses.some((address) => address.emailAddress.toLowerCase() === email));
      if (!exactMatch) return json({ error: "Aucun compte ZENO ne correspond à cette adresse." }, 404);
      recipientId = exactMatch.id;
    } catch (cause) {
      console.error("[api/recipients] Failed to find recipient by email:", cause);
      return json({ error: "Impossible de trouver ce compte pour le moment." }, 502);
    }
  }
  if (!recipientId || recipientId === auth.userId || recipientId.length > 128) return json({ error: "Bénéficiaire invalide." }, 400);

  try {
    const [owner, recipient] = await Promise.all([
      auth.clerk.users.getUser(auth.userId),
      auth.clerk.users.getUser(recipientId),
    ]);
    const currentIds = readContactIds(owner.privateMetadata[CONTACTS_KEY]);
    const contactIds = [recipientId, ...currentIds.filter((id) => id !== recipientId)].slice(0, MAX_CONTACTS);
    await auth.clerk.users.updateUserMetadata(auth.userId, { privateMetadata: { [CONTACTS_KEY]: contactIds } });
    return json({ recipient: recipientFromClerkUser(recipient), recipients: contactIds.map((id) => id) });
  } catch (cause) {
    console.error("[api/recipients] Failed to save contact:", cause);
    return json({ error: "Impossible d’ajouter ce contact pour le moment." }, 502);
  }
}

export async function DELETE(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const recipientId = new URL(request.url).searchParams.get("recipientId")?.trim() ?? "";
  if (!recipientId || recipientId.length > 128) return json({ error: "Contact invalide." }, 400);

  try {
    const owner = await auth.clerk.users.getUser(auth.userId);
    const contactIds = readContactIds(owner.privateMetadata[CONTACTS_KEY]).filter((id) => id !== recipientId);
    await auth.clerk.users.updateUserMetadata(auth.userId, { privateMetadata: { [CONTACTS_KEY]: contactIds } });
    return json({ recipients: contactIds });
  } catch (cause) {
    console.error("[api/recipients] Failed to remove contact:", cause);
    return json({ error: "Impossible de supprimer ce contact pour le moment." }, 502);
  }
}

function readContactIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, MAX_CONTACTS);
}
