import { createServerSupabaseClient } from "@/lib/server/supabase";
import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { hashTransactionPin, newPinSalt, verifyTransactionPin } from "@/lib/server/pin";
import { rateLimit } from "@/lib/server/rate-limit";

/** Enrolls the signed-in user's transaction PIN once. The device keeps its local unlock PIN separately. */
export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => null) as { pin?: unknown; currentPin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin : "";
  const currentPin = typeof body?.currentPin === "string" ? body.currentPin : "";
  if (!/^\d{6}$/.test(pin)) {
    return json({ error: "Le code PIN doit contenir 6 chiffres." }, 400);
  }
  if (currentPin && !/^\d{6}$/.test(currentPin)) {
    return json({ error: "Le code PIN actuel doit contenir 6 chiffres." }, 400);
  }
  const limit = rateLimit(`security:pin-enroll:${auth.userId}`, 10, 15 * 60);
  if (!limit.allowed) return json({ error: "Trop de tentatives. Réessaie dans 15 minutes." }, 429, limit.retryAfter);

  try {
    const salt = newPinSalt();
    const pinHash = await hashTransactionPin(pin, salt);
    const supabase = createServerSupabaseClient();
    const { data: existing, error: readError } = await supabase
      .from("user_security_pins")
      .select("salt, pin_hash")
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing) {
      const { data: lockRecord, error: lockError } = await supabase
        .from("user_security_pins")
        .select("locked_until")
        .eq("user_id", auth.userId)
        .maybeSingle();
      if (lockError) throw lockError;
      if (lockRecord?.locked_until && new Date(lockRecord.locked_until).getTime() > Date.now()) {
        return json({ error: "Le PIN est temporairement bloqué. Réessaie dans 15 minutes." }, 423);
      }

      if (currentPin) {
        const matchesCurrentPin = await verifyTransactionPin(currentPin, existing.salt, existing.pin_hash);
        if (!matchesCurrentPin) {
          const { error } = await supabase.rpc("record_pin_failure", { p_user_id: auth.userId });
          if (error) throw error;
          return json({ error: "Le PIN actuel est incorrect." }, 401);
        }
        const { error } = await supabase.from("user_security_pins").update({
          salt,
          pin_hash: pinHash,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", auth.userId);
        if (error) throw error;
        return json({ registered: true }, 200);
      }

      if (await verifyTransactionPin(pin, existing.salt, existing.pin_hash)) {
        return json({ registered: true }, 200);
      }
      return json({ error: "Un PIN de transaction est déjà configuré. Vérifie le PIN actuel avant de le modifier." }, 409);
    }

    const { error } = await supabase.from("user_security_pins").insert({
      user_id: auth.userId,
      salt,
      pin_hash: pinHash,
    });

    if (error?.code === "23505") {
      return json({ error: "Un PIN de transaction est déjà configuré." }, 409);
    }
    if (error) {
      console.error("[api/security/pin] Could not enroll PIN:", error);
      return json({ error: "Impossible de sécuriser le PIN sur le serveur." }, 502);
    }
    return json({ registered: true }, 201);
  } catch (cause) {
    console.error("[api/security/pin] PIN enrollment unavailable:", cause);
    return json({ error: "Le service PIN n’est pas configuré sur ce serveur." }, 503);
  }
}
