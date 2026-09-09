import { eq } from "drizzle-orm";
import { db } from "@/db";
import { debitCollections, debitMandates, paymentWebhookEvents } from "@/db/schema";
import { debitOrderProvider } from "@/lib/debit-orders/provider";
import { recordLedgerEntry } from "@/lib/ledger";
import { updateMandateStatus } from "@/lib/mandates";
import { logFinancialAction } from "@/lib/financial-reporting/audit";
import type { MandateStatus } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();

  // 1. Signature Verification
  if (!debitOrderProvider.verifyWebhookSignature(request.headers, rawBody)) {
    // If running in sandbox/development with no secret configured, allow structured test payload
    if (process.env.NODE_ENV === "production" && debitOrderProvider.isConfigured()) {
      return new Response("Invalid debit order webhook signature", { status: 403 });
    }
  }

  let event: {
    eventId?: string;
    eventType?: string;
    mandateReference?: string;
    status?: string;
    collectionReference?: string;
    amountCents?: number;
    feeCents?: number;
    failureReason?: string;
  };

  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const eventId = event.eventId ?? `DEBIT-EVT-${Date.now()}`;

  // 2. Idempotency Check
  try {
    await db.insert(paymentWebhookEvents).values({
      provider: "netcash_debit",
      eventId,
      eventType: event.eventType ?? "mandate.update",
      payload: rawBody.slice(0, 10000),
    });
  } catch {
    return new Response("Event already processed", { status: 200 });
  }

  // 3. Handle Mandate Status Updates
  if (event.mandateReference && event.status) {
    const statusMap: Record<string, MandateStatus> = {
      AUTHORISED: "ACTIVE",
      ACTIVE: "ACTIVE",
      REJECTED: "REJECTED",
      CANCELLED: "CANCELLED",
      SUSPENDED: "SUSPENDED",
      FAILED: "FAILED",
    };

    const targetStatus = statusMap[event.status.toUpperCase()];
    if (targetStatus) {
      await updateMandateStatus(
        event.mandateReference,
        targetStatus,
        event.failureReason,
        "debit-order-webhook",
      );
    }
  }

  // 4. Handle Collection Events
  if (event.collectionReference && event.eventType === "collection.settled") {
    const collection = await db.query.debitCollections.findFirst({
      where: eq(debitCollections.collectionReference, event.collectionReference),
    });

    if (collection && collection.status !== "COLLECTED") {
      const amount = event.amountCents ?? collection.amount;
      const fee = event.feeCents ?? 450; // standard SA debit fee ~R4.50

      await db
        .update(debitCollections)
        .set({
          status: "COLLECTED",
          feeAmount: fee,
          netAmount: Math.max(0, amount - fee),
          settledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(debitCollections.id, collection.id));

      await recordLedgerEntry({
        entryType: "DEBIT_COLLECTION_GROSS",
        amountCents: amount,
        relatedEntity: "debit_collection",
        relatedEntityId: collection.id,
        description: `Debit order collection settled: ${collection.collectionReference} (${(amount / 100).toFixed(2)} ZAR)`,
        recordedBy: "debit-order-webhook",
      });

      if (fee > 0) {
        await recordLedgerEntry({
          entryType: "DEBIT_COLLECTION_FEE",
          amountCents: fee,
          relatedEntity: "debit_collection",
          relatedEntityId: collection.id,
          description: `Debit collection bureau fee for ${collection.collectionReference}`,
          recordedBy: "debit-order-webhook",
        });
      }

      await logFinancialAction({
        adminEmail: "debit-order-webhook",
        action: "debit collection settled",
        entity: "debit_collection",
        entityId: collection.id,
        transactionReference: collection.collectionReference,
        newState: { status: "COLLECTED", amount, fee },
        detail: `Debit collection ${collection.collectionReference} settled for R${(amount / 100).toFixed(2)}`,
      });
    }
  }

  return new Response("OK", { status: 200 });
}
