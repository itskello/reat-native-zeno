/**
 * Dial codes ZENO will actually send an SMS to. Enforced server-side so a
 * tampered client cannot make us pay to text a country we do not serve — the
 * same class of protection Clerk's allowlist gave us, but under our control.
 *
 * "+1" is here only for Clerk-style test numbers during development; drop it
 * before production, or gate it on NODE_ENV.
 */
export const allowedDialCodes = ["+229", "+225", "+228", "+1"] as const;

export function isAllowedNumber(e164: string) {
  return allowedDialCodes.some((code) => e164.startsWith(code));
}
