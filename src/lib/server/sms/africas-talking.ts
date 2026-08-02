import { optionalEnv, requireEnv } from "@/lib/server/env";
import type { SmsProvider } from "@/lib/server/sms/types";

const LIVE_ENDPOINT = "https://api.africastalking.com/version1/messaging";
const SANDBOX_ENDPOINT =
  "https://api.sandbox.africastalking.com/version1/messaging";

type AfricasTalkingResponse = {
  SMSMessageData?: {
    Recipients?: { number?: string; status?: string; statusCode?: number }[];
  };
};

/**
 * Africa's Talking is the only provider that documents direct coverage of all
 * three launch markets (Benin, Côte d'Ivoire, Togo).
 *
 * Their sandbox uses the username "sandbox" and a separate host, so the
 * endpoint follows the username rather than a separate flag.
 */
export function createAfricasTalkingProvider(): SmsProvider {
  const username = requireEnv("AFRICASTALKING_USERNAME");
  const apiKey = requireEnv("AFRICASTALKING_API_KEY");
  const senderId = process.env.AFRICASTALKING_SENDER_ID;
  const endpoint = username === "sandbox" ? SANDBOX_ENDPOINT : LIVE_ENDPOINT;

  return {
    name: "africas-talking",
    async send({ to, body }) {
      const form = new URLSearchParams({ username, to, message: body });

      // Until the sender ID is registered with ARCEP Bénin / ARTCI / ARCEP Togo,
      // messages go out on a shared shortcode.
      if (senderId) {
        form.set("from", senderId);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apiKey,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });

      if (!response.ok) {
        throw new Error(
          `Africa's Talking rejected the request (${response.status})`
        );
      }

      const payload = (await response.json()) as AfricasTalkingResponse;
      const recipient = payload.SMSMessageData?.Recipients?.[0];

      // A 200 only means the request was accepted; the per-recipient status is
      // where an unroutable number or an out-of-credit account shows up.
      if (!recipient || recipient.statusCode !== 101) {
        throw new Error(
          `Africa's Talking could not queue the message: ${
            recipient?.status ?? "no recipient in response"
          }`
        );
      }
    },
  };
}

export const africasTalkingSegmentLimit = Number(
  optionalEnv("AFRICASTALKING_SEGMENT_LIMIT", "160")
);
