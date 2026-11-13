import { getProvider } from "@/data/mobile-money-providers";
import { findCountry } from "@/data/countries";
import type { CountryId, CurrencyCode, MobileMoneyProviderId } from "@/types/content";

export type MobileMoneyRequestInput = {
  countryId: "benin" | "cote-divoire";
  providerId: string;
  phoneNumber: string;
  idempotencyKey: string;
};

export function readMobileMoneyRecipient(body: Record<string, unknown> | null) {
  const countryId = body?.countryId;
  const providerId = typeof body?.providerId === "string" ? body.providerId.trim() : "";
  const phoneNumber = typeof body?.phoneNumber === "string" ? body.phoneNumber.trim() : "";
  const idempotencyKey = typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";

  if (countryId !== "benin" && countryId !== "cote-divoire") {
    return { ok: false as const, error: "Choose a supported Mobile Money country." };
  }
  const country = findCountry(countryId as CountryId);
  const provider = getProvider(providerId as MobileMoneyProviderId);
  if (!country || !provider || !provider.availableIn.includes(countryId)) {
    return { ok: false as const, error: "Choose a Mobile Money network available in this country." };
  }
  const inputDigits = phoneNumber.replace(/\D/g, "");
  const dialDigits = country.dialCode.replace(/\D/g, "");
  const digits = inputDigits.length === country.nationalNumberLength + dialDigits.length && inputDigits.startsWith(dialDigits)
    ? inputDigits.slice(dialDigits.length)
    : inputDigits;
  if (digits.length !== country.nationalNumberLength || !/^\+?[\d\s()-]+$/.test(phoneNumber)) {
    return { ok: false as const, error: "Enter a valid phone number for the selected country." };
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey)) {
    return { ok: false as const, error: "Transaction reference is invalid. Review and try again." };
  }
  return {
    ok: true as const,
    data: {
      countryId,
      providerId,
      providerName: provider.name,
      phoneNumber: digits,
      idempotencyKey,
    },
  };
}

export function readPositiveAmount(value: unknown, currency: CurrencyCode): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  const text = String(value);
  if (/[eE]/.test(text)) return null;
  const [whole, fraction = ""] = text.split(".");
  const digits = currency === "XOF" ? 0 : 2;
  if (!/^\d+$/.test(whole) || !/^\d*$/.test(fraction) || fraction.length > digits) return null;
  const amount = Number(whole) * (digits === 0 ? 1 : 100) + Number(fraction.padEnd(digits, "0") || "0");
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
