type ClerkApiError = {
  code?: string;
  message?: string;
  longMessage?: string;
};

/**
 * Maps Clerk error codes to user-friendly French messages.
 * Falls back to Clerk's own message if the code is not mapped.
 */
const CLERK_ERROR_MAP: Record<string, string> = {
  form_identifier_not_found:
    "Aucun compte trouvé avec cet email. Vérifiez l'adresse ou créez un compte.",
  form_password_incorrect:
    "Mot de passe incorrect. Réessayez ou utilisez une autre méthode.",
  form_param_format_invalid:
    "Format invalide. Vérifiez votre adresse email.",
  too_many_requests:
    "Trop de tentatives. Attendez quelques minutes avant de réessayer.",
  session_exists:
    "Vous êtes déjà connecté. Rechargez l'application.",
  network_error:
    "Erreur réseau. Vérifiez votre connexion internet.",
  identifier_already_signed_in:
    "Ce compte est déjà connecté sur cet appareil.",
  not_allowed_access:
    "Accès non autorisé. Vérifiez vos identifiants.",
};

/**
 * Clerk rejections carry an `errors` array with the actionable message. Showing
 * a generic string instead hides why a request failed, so we surface Clerk's own
 * wording (mapped to French) and keep the machine-readable code in the dev console.
 */
export function getClerkErrorMessage(cause: unknown, fallback: string) {
  const errors = (cause as { errors?: ClerkApiError[] })?.errors;
  const first = errors?.[0];

  if (__DEV__) {
    console.log("[clerk]", JSON.stringify(errors ?? cause, null, 2));
  }

  if (first?.code && CLERK_ERROR_MAP[first.code]) {
    return CLERK_ERROR_MAP[first.code];
  }

  return first?.longMessage ?? first?.message ?? fallback;
}
