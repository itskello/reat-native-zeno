type ClerkApiError = {
  code?: string;
  message?: string;
  longMessage?: string;
};

/**
 * Clerk rejections carry an `errors` array with the actionable message. Showing
 * a generic string instead hides why a request failed, so we surface Clerk's own
 * wording and keep the machine-readable code in the dev console.
 */
export function getClerkErrorMessage(cause: unknown, fallback: string) {
  const errors = (cause as { errors?: ClerkApiError[] })?.errors;
  const first = errors?.[0];

  // console.log, not console.warn: the error is already handled and shown to
  // the user, so it should not raise a red LogBox overlay — just a dev trace.
  if (__DEV__) {
    console.log("[clerk]", JSON.stringify(errors ?? cause, null, 2));
  }

  return first?.longMessage ?? first?.message ?? fallback;
}
