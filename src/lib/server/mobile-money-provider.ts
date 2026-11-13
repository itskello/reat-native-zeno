/**
 * Provider boundary for Mobile Money collection and payouts.
 * Implement this only after the chosen provider's API and webhook contract are
 * available; the adapter must verify callback signatures before returning an
 * event to the settlement service.
 */

export type MobileMoneyDirection = "deposit" | "withdrawal";
export type MobileMoneyOperationStatus =
  | "awaiting_authorization"
  | "processing"
  | "succeeded"
  | "failed";

export type MobileMoneyInitiation = {
  operationId: string;
  reference: string;
  direction: MobileMoneyDirection;
  countryId: "benin" | "cote-divoire";
  providerId: string;
  phoneNumber: string;
  amountXof: number;
  idempotencyKey: string;
};

export type MobileMoneyProviderResult = {
  providerOperationId: string;
  status: MobileMoneyOperationStatus;
  message?: string;
};

export type VerifiedMobileMoneyEvent = {
  eventId: string;
  providerOperationId: string;
  reference: string;
  status: "processing" | "succeeded" | "failed";
  amountXof: number;
  occurredAt: string;
};

export interface MobileMoneyProvider {
  readonly id: string;
  initiateCollection(input: MobileMoneyInitiation): Promise<MobileMoneyProviderResult>;
  initiatePayout(input: MobileMoneyInitiation): Promise<MobileMoneyProviderResult>;
  /** Returns null for invalid signatures, malformed events, or unsupported callbacks. */
  verifyWebhook(request: Request): Promise<VerifiedMobileMoneyEvent | null>;
  getOperationStatus(providerOperationId: string): Promise<MobileMoneyProviderResult>;
}

/** Fail closed until credentials and the provider's actual API contract exist. */
export function getMobileMoneyProvider(): MobileMoneyProvider | null {
  return null;
}
