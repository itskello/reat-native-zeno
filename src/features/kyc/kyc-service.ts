import { createZenoSupabaseClient } from "@/lib/supabase";
import type { CountryId } from "@/types/content";

type DiditSessionResult = {
  status: "pending";
  sessionToken: string;
};

type StartVerificationResult =
  | { ok: true; sessionToken: string }
  | { ok: false; error: string; errorFr: string };

/** Creates or resumes a Didit session for the signed-in user. */
export async function startDiditVerification(
  sessionToken: string,
  countryId: CountryId,
  language: "en" | "fr",
): Promise<StartVerificationResult> {
  try {
    const supabase = createZenoSupabaseClient(async () => sessionToken);
    const { data, error } = await supabase.functions.invoke<DiditSessionResult>(
      "didit-create-session",
      {
        body: { countryId, language },
        headers: { Authorization: `Bearer ${sessionToken}` },
      },
    );

    if (error || !data?.sessionToken || data.status !== "pending") {
      const message = error?.message ?? "Didit returned an invalid verification session.";
      return {
        ok: false,
        error: message,
        errorFr: "Impossible de démarrer la vérification. Vérifiez votre connexion puis réessayez.",
      };
    }

    return { ok: true, sessionToken: data.sessionToken };
  } catch {
    return {
      ok: false,
      error: "We could not reach the verification service. Check your connection and try again.",
      errorFr: "Impossible de joindre le service de vérification. Vérifiez votre connexion puis réessayez.",
    };
  }
}
