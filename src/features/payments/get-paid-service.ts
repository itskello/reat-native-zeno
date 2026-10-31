import { getAuthenticated, postAuthenticated } from "@/lib/api";
import type { CurrencyCode } from "@/types/content";

export type PaymentLink = {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: CurrencyCode;
  url: string;
  status: "active" | "paid" | "disabled";
  createdAt: string;
  paymentsCount: number;
};

export type PaymentRequestReceipt = {
  id: string;
  reference: string;
  status: "pending" | "completed";
  amount: number;
  currency: CurrencyCode;
  recipientName: string;
  createdAt: string;
};

export type PaymentLinkImage = { uri: string; name: string; mimeType: string };

/** Authenticated adapters. Financial records and QR payloads are supplied by the server. */
export const getPaidService = {
  listLinks(token: string) {
    return getAuthenticated<{ links: PaymentLink[] }>("/api/payment-links", token);
  },
  createLink(token: string, input: { title: string; description: string; amount: number; currency: CurrencyCode; idempotencyKey: string; image?: PaymentLinkImage | null }) {
    const form = new FormData();
    form.append("title", input.title);
    form.append("description", input.description);
    form.append("amount", String(input.amount));
    form.append("currency", input.currency);
    form.append("idempotencyKey", input.idempotencyKey);
    if (input.image) {
      form.append("image", {
        uri: input.image.uri,
        name: input.image.name,
        type: input.image.mimeType,
      } as unknown as Blob);
    }
    return postAuthenticated<{ link: PaymentLink }>("/api/payment-links", token, form);
  },
  requestMoney(token: string, input: { recipientId: string; amount: number; currency: CurrencyCode; note: string; idempotencyKey: string }) {
    return postAuthenticated<{ request: PaymentRequestReceipt }>("/api/payment-requests", token, input);
  },
  getQr(token: string) {
    return getAuthenticated<{ payload: string; sellerCode: string; qrImageUrl: string }>("/api/payments/qr", token);
  },
};
