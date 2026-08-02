import { optionalEnv } from "@/lib/server/env";
import { createAfricasTalkingProvider } from "@/lib/server/sms/africas-talking";
import { createConsoleProvider } from "@/lib/server/sms/console";
import type { SmsProvider } from "@/lib/server/sms/types";

export type SmsProviderId = "africas-talking" | "console";

const factories: Record<SmsProviderId, () => SmsProvider> = {
  "africas-talking": createAfricasTalkingProvider,
  console: createConsoleProvider,
};

let cached: SmsProvider | null = null;

/**
 * Resolves the configured transport. Adding a provider — ikoddi once we have
 * their raw-SMS contract, or a per-country router — means one file plus one
 * entry here; nothing else in the codebase changes.
 */
export function getSmsProvider(): SmsProvider {
  if (cached) {
    return cached;
  }

  const id = optionalEnv("SMS_PROVIDER", "console") as SmsProviderId;
  const factory = factories[id];

  if (!factory) {
    throw new Error(
      `Unknown SMS_PROVIDER "${id}". Expected one of: ${Object.keys(
        factories
      ).join(", ")}`
    );
  }

  cached = factory();
  return cached;
}
