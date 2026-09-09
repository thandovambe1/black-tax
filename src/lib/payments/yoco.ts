import { createHmac, timingSafeEqual } from "crypto";
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  TransactionStatus,
  WebhookVerificationResult,
} from "./types";

const YOCO_API_BASE = "https://payments.yoco.com/api";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function isYocoConfigured(): boolean {
  return Boolean(process.env.YOCO_SECRET_KEY);
}

export function isYocoLiveMode(): boolean {
  const key = process.env.YOCO_SECRET_KEY ?? "";
  return key.startsWith("sk_live_");
}

export type CreateCheckoutInput = {
  amount: number; // in cents
  reference: string;
  metadata?: Record<string, string>;
};

export type CreateCheckoutResult =
  | { ok: true; checkoutId: string; redirectUrl: string; status: string }
  | { ok: false; error: string };

/**
 * Creates a Yoco hosted checkout. Always called server-side so the secret key
 * is never exposed to the browser. Returns the redirectUrl to send the donor to.
 */
export async function createYocoCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const secret = process.env.YOCO_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Payment gateway is not configured yet." };
  }

  const site = getSiteUrl();

  try {
    const response = await fetch(`${YOCO_API_BASE}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        // Idempotency prevents duplicate charges on retries.
        "Idempotency-Key": input.reference,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: "ZAR",
        successUrl: `${site}/donate/result?ref=${input.reference}&status=success`,
        cancelUrl: `${site}/donate/result?ref=${input.reference}&status=cancel`,
        failureUrl: `${site}/donate/result?ref=${input.reference}&status=failed`,
        metadata: { reference: input.reference, ...input.metadata },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Yoco checkout failed (${response.status}): ${errText || "Payment provider rejected request"}`,
      };
    }

    const data = (await response.json()) as { id: string; redirectUrl: string; status: string };
    return { ok: true, checkoutId: data.id, redirectUrl: data.redirectUrl, status: data.status };
  } catch (err) {
    return {
      ok: false,
      error: `Could not reach Yoco payment gateway: ${err instanceof Error ? err.message : "Network error"}`,
    };
  }
}

/**
 * Verifies a Yoco webhook using the Svix-style signing scheme.
 * signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * The webhook-signature header is a space-separated list of `v1,<base64sig>`.
 */
export function verifyYocoWebhook(headers: Headers, rawBody: string): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) return false;

  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatureHeader = headers.get("webhook-signature");
  if (!id || !timestamp || !signatureHeader) return false;

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const secretPart = secret.split("_")[1] ?? secret;
  const secretBytes = Buffer.from(secretPart, "base64");
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  // Header can contain multiple space-separated signatures, each "v1,<sig>"
  const candidates = signatureHeader.split(" ").map((part) => part.split(",")[1] ?? "");
  return candidates.some((candidate) => {
    if (!candidate) return false;
    const a = Buffer.from(expected);
    const b = Buffer.from(candidate);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

/**
 * Authoritative PaymentProvider implementation for Yoco online card payments.
 */
export const yocoProvider: PaymentProvider = {
  name: "yoco",

  isConfigured(): boolean {
    return isYocoConfigured();
  },

  async createCheckout(input: PaymentIntentInput): Promise<PaymentIntentResult> {
    const result = await createYocoCheckout({
      amount: input.amountCents,
      reference: input.reference,
      metadata: {
        reference: input.reference,
        donorName: input.donorName,
        donorEmail: input.donorEmail,
        donorPhone: input.donorPhone ?? "",
        province: input.province,
        recurring: String(input.isRecurring),
        anonymous: String(Boolean(input.isAnonymous)),
        ...input.metadata,
      },
    });

    if (result.ok) {
      return {
        ok: true,
        checkoutId: result.checkoutId,
        redirectUrl: result.redirectUrl,
        reference: input.reference,
        status: "PENDING",
      };
    }

    return {
      ok: false,
      reference: input.reference,
      status: "FAILED",
      error: result.error,
    };
  },

  async verifyWebhook(headers: Headers, rawBody: string): Promise<WebhookVerificationResult> {
    // 1. Verify cryptographic signature first before parsing
    const isSignatureValid = verifyYocoWebhook(headers, rawBody);
    if (!isSignatureValid) {
      return {
        isValid: false,
        errorMessage: "Invalid Yoco webhook signature.",
      };
    }

    // 2. Parse payload safely
    let event: {
      id?: string;
      type?: string;
      payload?: {
        id?: string;
        status?: string;
        amount?: number;
        fee?: number;
        metadata?: Record<string, string>;
      };
      metadata?: Record<string, string>;
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return {
        isValid: false,
        errorMessage: "Invalid Yoco webhook payload.",
      };
    }

    const eventId = headers.get("webhook-id") || event.id;
    const eventType = event.type ?? "";
    const payload =
      event.payload ??
      (event as unknown as {
        id?: string;
        status?: string;
        amount?: number;
        fee?: number;
        metadata?: Record<string, string>;
      });
    const reference = payload?.metadata?.reference ?? event.metadata?.reference;
    const providerPaymentId = payload?.id ?? event.id;
    const amountCents = payload?.amount;
    const feeCents = payload?.fee ?? 0;

    let status: TransactionStatus = "PROCESSING";
    if (eventType === "payment.succeeded" || payload?.status === "succeeded") {
      status = "SUCCEEDED";
    } else if (eventType === "payment.failed" || payload?.status === "failed") {
      status = "FAILED";
    }

    return {
      isValid: true,
      eventId,
      eventType,
      reference,
      providerPaymentId,
      amountCents,
      feeCents,
      status,
      rawPayload: rawBody,
    };
  },
};
