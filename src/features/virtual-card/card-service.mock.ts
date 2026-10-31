/**
 * Mock Virtual Card Service
 *
 * Temporary mock implementation for testing UI flows before backend is ready.
 * Returns fake card data after simulated delays.
 *
 * To use: Replace imports in VirtualCardFlowModal.tsx:
 * - FROM: import { virtualCardService } from "@/features/virtual-card/card-service"
 * - TO: import { virtualCardService } from "@/features/virtual-card/card-service.mock"
 */

import type { VirtualCardDetails, VirtualCardStatus } from "./card-service";

type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Simulated card status (shared across mock calls)
let mockCardStatus: VirtualCardStatus = "active";

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Mock card details (fake data for testing) */
const MOCK_CARD_DETAILS: VirtualCardDetails = {
  cardholderName: "John Doe",
  number: "4532 1234 5678 9012",
  expiry: "12/2028",
  cvc: "123",
  last4: "9012",
};

export const virtualCardService = {
  async getDetails(_sessionToken: string): Promise<ApiResult<VirtualCardDetails>> {
    await delay(800); // Simulate API delay

    // Simulate success 90% of the time
    if (Math.random() > 0.1) {
      return {
        ok: true,
        data: MOCK_CARD_DETAILS,
      };
    } else {
      return {
        ok: false,
        error: "Failed to retrieve card details. Please try again.",
      };
    }
  },

  async getStatus(_sessionToken: string): Promise<ApiResult<{ status: VirtualCardStatus }>> {
    await delay(400);

    return {
      ok: true,
      data: { status: mockCardStatus },
    };
  },

  async freeze(_sessionToken: string): Promise<ApiResult<{ status: "frozen" }>> {
    await delay(600);

    // Simulate success
    mockCardStatus = "frozen";
    return {
      ok: true,
      data: { status: "frozen" },
    };
  },

  async unfreeze(_sessionToken: string): Promise<ApiResult<{ status: "active" }>> {
    await delay(600);

    // Simulate success
    mockCardStatus = "active";
    return {
      ok: true,
      data: { status: "active" },
    };
  },
};
