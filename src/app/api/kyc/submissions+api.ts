import { json } from "@/lib/server/recipients-auth";

/** KYC stays disabled until Didit or AiPrise is selected and configured. */
export async function POST() {
  return json({ error: "Identity verification is not available yet." }, 503);
}
