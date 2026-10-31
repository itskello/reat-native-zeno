import { createClerkClient, verifyToken } from "@clerk/backend";

export async function getRecipientsAuth(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return { ok: false as const, status: 401, error: "Connecte-toi pour continuer." };
  }

  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    return { ok: false as const, status: 503, error: "Le service Clerk n’est pas configuré sur le serveur." };
  }

  try {
    const claims = await verifyToken(token, { secretKey });
    if (typeof claims.sub !== "string" || !claims.sub || typeof claims.sid !== "string" || !claims.sid) {
      return { ok: false as const, status: 401, error: "Session invalide. Reconnecte-toi puis réessaie." };
    }
    return {
      ok: true as const,
      userId: claims.sub,
      sessionId: claims.sid,
      secretKey,
      clerk: createClerkClient({ secretKey }),
    };
  } catch {
    return { ok: false as const, status: 401, error: "Session invalide. Reconnecte-toi puis réessaie." };
  }
}

export function recipientFromClerkUser(user: {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
}) {
  const name = [user.firstName, user.lastName].filter((part): part is string => Boolean(part?.trim())).join(" ").trim();
  return {
    id: user.id,
    name: name || user.username || "ZENO User",
    zenoId: user.username ? `@${user.username}` : undefined,
    avatarUrl: user.imageUrl,
  };
}

export function json(data: unknown, status = 200, retryAfter?: number) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (retryAfter !== undefined) headers["Retry-After"] = String(retryAfter);
  return new Response(JSON.stringify(data), { status, headers });
}
