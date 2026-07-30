import { createHmac, timingSafeEqual } from "crypto";

const YOCO_API_BASE = "https://payments.yoco.com/api";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function isYocoConfigured() {
  return Boolean(process.env.YOCO_SECRET_KEY);
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
      return { ok: false, error: `Yoco checkout failed (${response.status}).` };
    }

    const data = (await response.json()) as { id: string; redirectUrl: string; status: string };
    return { ok: true, checkoutId: data.id, redirectUrl: data.redirectUrl, status: data.status };
  } catch {
    return { ok: false, error: "Could not reach the payment gateway. Please try again." };
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
  const secretBytes = Buffer.from(secret.split("_")[1] ?? secret, "base64");
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
