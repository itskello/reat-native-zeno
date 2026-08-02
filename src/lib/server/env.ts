/**
 * Server-only environment access.
 *
 * Nothing in `src/lib/server/` may be imported from a screen or a client hook:
 * these values have no `EXPO_PUBLIC_` prefix precisely so they are never bundled
 * into the app. A key shipped to the device is a key an attacker can extract
 * from the APK, and an SMS gateway credential in the wild means somebody else
 * sends messages on ZENO's account, at ZENO's expense.
 */
export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string, fallback: string) {
  return process.env[name] ?? fallback;
}
