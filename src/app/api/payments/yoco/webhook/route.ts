import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, donorWallMessages, paymentWebhookEvents } from "@/db/schema";
import { yocoProvider } from "@/lib/payments/yoco";
import { recordLedgerEntry } from "@/lib/ledger";
import { logFinancialAction } from "@/lib/financial-reporting/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  // 1. Authoritative Webhook Signature Verification
  const verification = await yocoProvider.verifyWebhook(request.headers, rawBody);
  if (!verification.isValid) {
    console.warn("[webhook:yoco] signature verification failed:", verification.errorMessage);
    return new Response(verification.errorMessage ?? "Invalid signature", { status: 403 });
  }

  const eventId = verification.eventId;
  if (!eventId) {
    return new Response("Missing event ID", { status: 400 });
  }

  // 2. Idempotency Check: Prevent duplicate processing of the same provider event
  try {
    await db.insert(paymentWebhookEvents).values({
      provider: "yoco",
      eventId,
      eventType: verification.eventType ?? "payment.event",
      payload: rawBody.slice(0, 10000),
    });
  } catch {
    // Duplicate webhook received -> return 200 immediately without re-crediting the ledger
    return new Response("Event already processed (idempotent)", { status: 200 });
  }

  const reference = verification.reference;
  if (!reference) {
    return new Response("Event received without reference", { status: 200 });
  }

  // 3. Retrieve internal donation record
  const donation = await db.query.donations.findFirst({
    where: eq(donations.reference, reference),
  });

  if (!donation) {
    console.warn(`[webhook:yoco] unknown internal reference: ${reference}`);
    return new Response("Reference not found in ledger", { status: 200 });
  }

  const previousState = {
    status: donation.status,
    amount: donation.amount,
    feeAmount: donation.feeAmount,
  };

  // 4. Handle State Transitions
  if (verification.status === "SUCCEEDED") {
    // If already succeeded, do not double-credit ledger
    if (donation.status === "SUCCEEDED") {
      return new Response("Donation already settled", { status: 200 });
    }

    const verifiedAmount = verification.amountCents ?? donation.amount;
    const feeAmount = verification.feeCents ?? 0;
    const netAmount = Math.max(0, verifiedAmount - feeAmount);

    // Update donation record
    await db
      .update(donations)
      .set({
        status: "SUCCEEDED",
        amount: verifiedAmount,
        feeAmount,
        netAmount,
        providerPaymentId: verification.providerPaymentId ?? donation.providerPaymentId,
        settledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(donations.id, donation.id));

    // Append to Immutable Financial Ledger
    await recordLedgerEntry({
      entryType: "DONATION_GROSS",
      amountCents: verifiedAmount,
      relatedEntity: "donation",
      relatedEntityId: donation.id,
      description: `Verified donation received: ${donation.reference} (${(verifiedAmount / 100).toFixed(2)} ZAR from ${donation.isAnonymous ? "Anonymous" : donation.donorName})`,
      recordedBy: "yoco-webhook",
    });

    if (feeAmount > 0) {
      await recordLedgerEntry({
        entryType: "PAYMENT_FEE",
        amountCents: feeAmount,
        relatedEntity: "donation",
        relatedEntityId: donation.id,
        description: `Payment processing fee for donation ${donation.reference}`,
        recordedBy: "yoco-webhook",
      });
    }

    // Publish to Donor Wall if a message was requested and not yet published
    if (donation.wallMessage && !donation.wallPublished) {
      const displayName = donation.isAnonymous ? "Anonymous" : donation.donorName;
      await db.insert(donorWallMessages).values({
        displayName,
        location: donation.wallLocation ?? "",
        messageType: donation.wallMessageType ?? "support",
        message: donation.wallMessage,
        amount: donation.wallShowAmount ? Math.round(verifiedAmount / 100) : null,
        showAmount: donation.wallShowAmount,
      });

      await db
        .update(donations)
        .set({ wallPublished: true })
        .where(eq(donations.id, donation.id));
    }

    // Audit log
    await logFinancialAction({
      adminEmail: "yoco-webhook",
      action: "donation succeeded",
      entity: "donation",
      entityId: donation.id,
      transactionReference: donation.reference,
      previousState,
      newState: { status: "SUCCEEDED", amount: verifiedAmount, feeAmount, netAmount },
      detail: `Donation ${donation.reference} verified and settled for R${(verifiedAmount / 100).toFixed(2)}`,
    });
  } else if (verification.status === "FAILED") {
    await db
      .update(donations)
      .set({
        status: "FAILED",
        failureReason: "Payment authorization failed at provider.",
        updatedAt: new Date(),
      })
      .where(eq(donations.id, donation.id));

    await logFinancialAction({
      adminEmail: "yoco-webhook",
      action: "donation failed",
      entity: "donation",
      entityId: donation.id,
      transactionReference: donation.reference,
      previousState,
      newState: { status: "FAILED" },
      detail: `Donation ${donation.reference} authorization failed`,
    });
  }

  return new Response("OK", { status: 200 });
}
