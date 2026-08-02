/**
 * Shared by the app and the API routes, so a number is normalised the same way
 * on both sides. Contains no secrets and is safe to bundle into the client.
 */

/** "+229" + "01 42 07 75 48" -> "+2290142077548" */
export function toE164(dialCode: string, phoneNumber: string) {
  return `${dialCode}${phoneNumber.replace(/\D/g, "")}`;
}

/** Rejects anything that is not a plausible E.164 number. */
export function isE164(value: string) {
  return /^\+[1-9]\d{6,14}$/.test(value);
}

/** "+2290142077548" -> "+229 •••• •• 48", for logs and error messages. */
export function maskPhoneNumber(value: string) {
  if (value.length < 4) {
    return value;
  }

  return `${value.slice(0, 4)}${"•".repeat(
    Math.max(0, value.length - 6)
  )}${value.slice(-2)}`;
}
