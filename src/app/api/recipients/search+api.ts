import { rateLimit } from "@/lib/server/rate-limit";
import { getRecipientsAuth, json, recipientFromClerkUser } from "@/lib/server/recipients-auth";

const MIN_QUERY_LENGTH = 1;
const MAX_QUERY_LENGTH = 80;
const MAX_RESULTS = 20;

/** Search public ZENO profile fields; never return email addresses or phone numbers. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("query")?.trim() ?? "";
  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return json({ error: "Saisis entre 1 et 80 caractères pour rechercher." }, 400);
  }

  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`recipients:search:${auth.userId}`, 300, 60);
  if (!limit.allowed) {
    return json(
      { error: "Trop de recherches. Attends un instant puis réessaie." },
      429,
      limit.retryAfter
    );
  }

  try {
    const normalizedQuery = normalizeForSearch(query);
    // Clerk performs the account search server-side. Keep the page bounded so
    // typing one character never causes the app to scan the entire directory.
    const result = await auth.clerk.users.getUserList({
      query,
      limit: 100,
      orderBy: "-last_active_at",
    });
    const matchingUsers = result.data.filter((user) => {
      if (user.id === auth.userId) return false;
      const publicName = [user.firstName, user.lastName, user.username]
        .filter((part): part is string => Boolean(part?.trim()))
        .join(" ");
      return normalizeForSearch(publicName).includes(normalizedQuery);
    });
    // Prefer names beginning with the typed text, then keep substring matches.
    matchingUsers.sort((left, right) => {
      const leftName = normalizeForSearch([left.firstName, left.lastName, left.username].filter(Boolean).join(" "));
      const rightName = normalizeForSearch([right.firstName, right.lastName, right.username].filter(Boolean).join(" "));
      return Number(!leftName.startsWith(normalizedQuery)) - Number(!rightName.startsWith(normalizedQuery));
    });

    return json({ recipients: matchingUsers.slice(0, MAX_RESULTS).map(recipientFromClerkUser) });
  } catch (cause) {
    console.error("[api/recipients/search] Clerk user search failed:", cause);
    return json({ error: "La recherche est temporairement indisponible. Réessaie." }, 502);
  }
}

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}
