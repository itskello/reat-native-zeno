import { getMobileMoneyRoute, normalizeLocalPhone, parseMobileMoneyMarket } from "./mobile-money-markets.ts";

export function readMobileMoneyRecipient(body: Record<string, unknown> | null) {
  const countryId = body?.countryId;
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  const marketId = parseMobileMoneyMarket(countryId);
  if (!marketId) {
    return { ok: false as const, error: "Choisis un pays Mobile Money pris en charge." };
  }
  const route = getMobileMoneyRoute(marketId, providerId);
  if (!route || route.provider !== "paydunya") return { ok: false as const, error: "Choisis un réseau disponible avec les retraits activés." };
  const normalizedPhone = normalizeLocalPhone(marketId, phoneNumber);
  if (!normalizedPhone || !/^\+?[\d\s()-]+$/.test(phoneNumber)) {
    return { ok: false as const, error: "Saisis un numéro valide pour le pays choisi." };
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return { ok: false as const, error: "La référence de transaction est invalide." };
  }
  return { ok: true as const, data: { countryId: marketId, providerId, providerName: route.name, phoneNumber: normalizedPhone.national, e164: normalizedPhone.e164, currency: route.market.currency, idempotencyKey } };
}
