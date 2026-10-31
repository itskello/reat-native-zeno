import { postAuthenticated } from "@/lib/api";
import type { CountryId, KycDocumentType } from "@/types/content";

export type KycCapture = {
  uri: string;
  name: string;
  type: string;
};

export type KycSubmission = {
  countryId: CountryId;
  documentType: KycDocumentType;
  front: KycCapture;
  back?: KycCapture;
  selfie: KycCapture;
};

type KycSubmissionResult =
  | { ok: true; status: "pending" }
  | { ok: false; error: string; errorFr: string };

/**
 * Sends identity images only to ZENO's authenticated server route. The server
 * must forward them to the configured KYC provider and return `pending`; the
 * app never approves a document or stores identity images as a verified result.
 */
export async function submitKycVerification(
  sessionToken: string,
  submission: KycSubmission,
): Promise<KycSubmissionResult> {
  const form = new FormData();
  form.append("countryId", submission.countryId);
  form.append("documentType", submission.documentType);
  appendCapture(form, "documentFront", submission.front);
  if (submission.back) appendCapture(form, "documentBack", submission.back);
  appendCapture(form, "selfie", submission.selfie);

  const result = await postAuthenticated<{ status: string }>(
    "/api/kyc/submissions",
    sessionToken,
    form,
  );

  if (!result.ok) {
    if (result.status === 404 || result.status === 503) {
      return {
        ok: false,
        error: "Identity verification is not available yet. Please try again later.",
        errorFr: "Le service de vérification d’identité n’est pas encore disponible. Réessayez plus tard.",
      };
    }
    return {
      ok: false,
      error: result.error,
      errorFr: "Impossible d’envoyer le dossier pour le moment. Vérifiez votre connexion et réessayez.",
    };
  }

  if (result.data.status !== "pending") {
    return {
      ok: false,
      error: "The verification server returned an invalid status. Please try again later.",
      errorFr: "Le serveur de vérification a renvoyé un statut invalide. Réessayez plus tard.",
    };
  }

  return { ok: true, status: "pending" };
}

function appendCapture(form: FormData, field: string, capture: KycCapture) {
  form.append(field, {
    uri: capture.uri,
    name: capture.name,
    type: capture.type,
  } as unknown as Blob);
}
