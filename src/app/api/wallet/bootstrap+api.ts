import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { createServerSupabaseClient } from "@/lib/server/supabase";
import { rateLimit } from "@/lib/server/rate-limit";

/** Creates the signed-in user's zero-balance accounts once; safe to retry. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`wallet:bootstrap:${auth.userId}`, 10, 60);
  if (!limit.allowed) {
    return json(
      { error: "Trop de demandes. Réessaie dans un instant." },
      429,
      limit.retryAfter
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.rpc("provision_wallet_accounts", {
      p_user_id: auth.userId,
    });

    if (error) {
      console.error("[api/wallet/bootstrap] Account provisioning failed:", error);
      return json({ error: "Impossible de préparer le portefeuille." }, 502);
    }

    return json({ ready: true });
  } catch (cause) {
    console.error("[api/wallet/bootstrap] Supabase is unavailable:", cause);
    return json({ error: "Le portefeuille n’est pas encore configuré sur ce serveur." }, 503);
  }
}
