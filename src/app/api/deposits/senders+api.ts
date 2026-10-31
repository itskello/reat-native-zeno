import { getRecipientsAuth, json } from "@/lib/server/recipients-auth";
import { rateLimit } from "@/lib/server/rate-limit";
import { findCountry } from "@/data/countries";
import { getProvidersForCountry } from "@/data/mobile-money-providers";
import type { AddMoneyCountry } from "@/features/mobile-money/add-money-service";

const SENDERS_KEY = "zenoDepositSenders";
const MAX_SENDERS = 50;

type StoredSender = {
  id: string;
  name?: string;
  countryId: AddMoneyCountry;
  phoneNumber: string;
  providerId: string;
  providerName: string;
};

export async function GET(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    return json({ senders: readSenders(user.privateMetadata[SENDERS_KEY]) });
  } catch (cause) {
    console.error("[api/deposits/senders] Failed to load senders:", cause);
    return json({ error: "Impossible de charger les envoyeurs pour le moment." }, 502);
  }
}

export async function POST(request: Request) {
  const auth = await getRecipientsAuth(request);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const limit = rateLimit(`deposit-senders:save:${auth.userId}`, 30, 60);
  if (!limit.allowed) return json({ error: "Trop d’actions. Réessaie dans un instant." }, 429, limit.retryAfter);

  const body = await request.json().catch(() => null) as {
    name?: unknown;
    phoneNumber?: unknown;
    providerId?: unknown;
    countryId?: unknown;
  } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.replace(/\D/g, "") : "";
  const providerId = typeof body?.providerId === "string" ? body.providerId : "";
  const countryId = body?.countryId === "cote-divoire" ? "cote-divoire" : body?.countryId === "benin" ? "benin" : null;
  const country = countryId ? findCountry(countryId) : undefined;
  const provider = countryId ? getProvidersForCountry(countryId).find((item) => item.id === providerId) : undefined;

  if (name && (name.length < 2 || name.length > 80)) return json({ error: "Le nom doit contenir entre 2 et 80 caractères." }, 400);
  if (!countryId || !country) return json({ error: "Choisis un pays pris en charge." }, 400);
  if (!provider) return json({ error: "Choisis un réseau Mobile Money disponible dans ce pays." }, 400);

  const dialDigits = country.dialCode.replace(/\D/g, "");
  const nationalNumber = phoneNumber.length === country.nationalNumberLength + dialDigits.length && phoneNumber.startsWith(dialDigits)
    ? phoneNumber.slice(dialDigits.length)
    : phoneNumber;
  if (nationalNumber.length !== country.nationalNumberLength || !/^\d+$/.test(nationalNumber)) {
    return json({ error: `Saisis un numéro ${country.name} valide à ${country.nationalNumberLength} chiffres.` }, 400);
  }

  const normalizedPhone = `${country.dialCode}${nationalNumber}`;
  const sender: StoredSender = {
    id: `${countryId}:${providerId}:${normalizedPhone}`,
    ...(name ? { name } : {}),
    countryId,
    phoneNumber: normalizedPhone,
    providerId,
    providerName: provider.name,
  };

  try {
    const user = await auth.clerk.users.getUser(auth.userId);
    const existing = readSenders(user.privateMetadata[SENDERS_KEY]);
    const senders = [sender, ...existing.filter((item) => item.id !== sender.id)].slice(0, MAX_SENDERS);
    await auth.clerk.users.updateUserMetadata(auth.userId, {
      privateMetadata: { [SENDERS_KEY]: senders },
    });
    return json({ sender, senders });
  } catch (cause) {
    console.error("[api/deposits/senders] Failed to save sender:", cause);
    return json({ error: "Impossible d’enregistrer cet envoyeur pour le moment." }, 502);
  }
}

function readSenders(value: unknown): StoredSender[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const sender = item as Partial<StoredSender>;
    const countryId = sender.countryId === "benin" || sender.countryId === "cote-divoire" ? sender.countryId : undefined;
    const providerName = countryId
      ? getProvidersForCountry(countryId).find((provider) => provider.id === sender.providerId)?.name
      : undefined;
    if (
      typeof sender.id !== "string" ||
      typeof sender.phoneNumber !== "string" ||
      !countryId ||
      typeof sender.providerId !== "string" ||
      !providerName
    ) return [];
    return [{ ...sender, countryId, providerName } as StoredSender];
  }).slice(0, MAX_SENDERS);
}
