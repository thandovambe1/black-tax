import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, donorWallMessages, paymentWebhookEvents } from "@/db/schema";
import { verifyYocoWebhook } from "@/lib/payments/yoco";

export const dynamic = "force-dynamic";

type YocoWebhookPayload = {
  id?: string;
  type?: string;
  payload?: {
    id?: string;
    status?: string;
    metadata?: Record<string, string>;
    amount?: number;
  };
};

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyYocoWebhook(request.headers, rawBody)) {
    return new Response("Invalid signature", { status: 403 });
  }

  let event: YocoWebhookPayload;
  try {
    event = JSON.parse(rawBody) as YocoWebhookPayload;
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  const eventId = request.headers.get("webhook-id") ?? event.id ?? "";
  if (!eventId) {
    return new Response("Missing event id", { status: 400 });
  }

  // Idempotency: ignore events we've already processed.
  try {
    await db.insert(paymentWebhookEvents).values({
      provider: "yoco",
      eventId,
      eventType: event.type ?? "",
      payload: rawBody.slice(0, 8000),
    });
  } catch {
    // Duplicate event id → already handled.
    return new Response("Already processed", { status: 200 });
  }

  const reference = event.payload?.metadata?.reference;
  if (!reference) {
    return new Response("OK", { status: 200 });
  }

  const donation = await db.query.donations.findFirst({
    where: eq(donations.reference, reference),
  });
  if (!donation) {
    return new Response("OK", { status: 200 });
  }

  const type = event.type ?? "";
  const isSuccess = type === "payment.succeeded" || event.payload?.status === "succeeded";
  const isFailed = type === "payment.failed" || event.payload?.status === "failed";

  const newStatus = isSuccess ? "succeeded" : isFailed ? "failed" : donation.status;

  await db
    .update(donations)
    .set({
      status: newStatus,
      providerPaymentId: event.payload?.id ?? donation.providerPaymentId,
      updatedAt: new Date(),
    })
    .where(eq(donations.id, donation.id));

  // Publish the optional donor-wall message once, on success.
  if (isSuccess && donation.wallMessage && !donation.wallPublished) {
    await db.insert(donorWallMessages).values({
      displayName: donation.donorName,
      location: donation.wallLocation ?? "",
      messageType: donation.wallMessageType ?? "support",
      message: donation.wallMessage,
      amount: donation.wallShowAmount ? Math.round(donation.amount / 100) : null,
      showAmount: donation.wallShowAmount,
    });
    await db.update(donations).set({ wallPublished: true }).where(eq(donations.id, donation.id));
  }

  return new Response("OK", { status: 200 });
}
