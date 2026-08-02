import type { SmsProvider } from "@/lib/server/sms/types";

/**
 * Development transport: writes the message to the server console instead of
 * paying for an SMS. This is a real transport choice for local work, not a stub
 * of the verification logic — the OTP is still generated, signed and checked by
 * the same server code that runs in production.
 *
 * Refuses to load outside development so it can never silently swallow a
 * production message.
 */
export function createConsoleProvider(): SmsProvider {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "The console SMS provider cannot be used in production. Set SMS_PROVIDER."
    );
  }

  return {
    name: "console",
    async send({ to, body }) {
      // Single line: Metro's terminal only surfaces the first line of a log,
      // so a "\n" before the code would hide exactly the part you need to read.
      console.log(`[sms:console] → ${to} | ${body}`);
    },
  };
}
