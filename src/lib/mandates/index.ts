import { eq } from "drizzle-orm";
import { db } from "@/db";
import { debitCollections, debitMandates, financialAuditLogs } from "@/db/schema";
import type { MandateStatus } from "../payments/types";
import { debitOrderProvider } from "../debit-orders/provider";
import type { DebitMandateInput, DebitMandateResult } from "../debit-orders/types";

/**
 * Mandate lifecycle manager.
 * Ensures strict compliance with South African debit order regulations.
 */
export async function createDebitMandate(input: DebitMandateInput): Promise<DebitMandateResult> {
  const result = await debitOrderProvider.registerMandate(input);

  const [mandate] = await db
    .insert(debitMandates)
    .values({
      mandateReference: input.mandateReference,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      donorPhone: input.donorPhone,
      province: input.province,
      bankName: input.bankName,
      accountNumberMasked: input.accountNumberMasked,
      accountType: input.accountType,
      branchCode: input.branchCode,
      amount: input.amountCents,
      collectionDay: input.collectionDay,
      frequency: "monthly",
      provider: debitOrderProvider.name,
      mandateType: input.mandateType,
      status: result.status,
      providerMandateId: result.providerMandateId,
      metadata: {
        authRequired: result.authRequired,
        authInstructions: result.authInstructions,
      },
    })
    .returning();

  await db.insert(financialAuditLogs).values({
    adminEmail: "system",
    action: "mandate created",
    entity: "debit_mandate",
    entityId: mandate.id,
    transactionReference: input.mandateReference,
    newState: {
      mandateReference: input.mandateReference,
      bankName: input.bankName,
      amount: input.amountCents,
      status: result.status,
    },
    detail: `Debit mandate ${input.mandateReference} created for ${input.donorName} (${(input.amountCents / 100).toFixed(2)} ZAR monthly)`,
  });

  return result;
}

export async function updateMandateStatus(
  mandateReference: string,
  newStatus: MandateStatus,
  reason?: string,
  actor = "system",
) {
  const existing = await db.query.debitMandates.findFirst({
    where: eq(debitMandates.mandateReference, mandateReference),
  });

  if (!existing) {
    throw new Error(`Mandate ${mandateReference} not found.`);
  }

  const previousState = { status: existing.status };
  const newState = { status: newStatus, rejectionReason: reason };

  await db
    .update(debitMandates)
    .set({
      status: newStatus,
      rejectionReason: reason ?? existing.rejectionReason,
      updatedAt: new Date(),
    })
    .where(eq(debitMandates.id, existing.id));

  await db.insert(financialAuditLogs).values({
    adminEmail: actor,
    action: `mandate status updated to ${newStatus}`,
    entity: "debit_mandate",
    entityId: existing.id,
    transactionReference: mandateReference,
    previousState,
    newState,
    detail: `Mandate ${mandateReference} transition: ${existing.status} -> ${newStatus}${reason ? ` (${reason})` : ""}`,
  });
}

/**
 * Pre-collection safety validator.
 * Validates that an authorized mandate exists, is active, has not been canceled,
 * and that a duplicate collection has not already been submitted for the target period.
 */
export async function validatePreCollectionSafety(
  mandateReference: string,
  collectionDate: Date,
): Promise<{ safe: boolean; reason?: string; mandate?: typeof debitMandates.$inferSelect }> {
  const mandate = await db.query.debitMandates.findFirst({
    where: eq(debitMandates.mandateReference, mandateReference),
  });

  if (!mandate) {
    return { safe: false, reason: "Mandate does not exist." };
  }

  if (mandate.status !== "ACTIVE" && mandate.status !== "AUTHORISED") {
    return {
      safe: false,
      reason: `Cannot collect on mandate with status "${mandate.status}". Mandate must be ACTIVE or AUTHORISED.`,
      mandate,
    };
  }

  // Check for duplicate collection in the same month
  const targetYear = collectionDate.getFullYear();
  const targetMonth = collectionDate.getMonth();

  const existingCollections = await db.query.debitCollections.findMany({
    where: eq(debitCollections.mandateId, mandate.id),
  });

  const duplicate = existingCollections.find((c) => {
    const d = new Date(c.collectionDate);
    return (
      d.getFullYear() === targetYear &&
      d.getMonth() === targetMonth &&
      c.status !== "FAILED" &&
      c.status !== "RECALLED"
    );
  });

  if (duplicate) {
    return {
      safe: false,
      reason: `Duplicate collection detected: Collection ${duplicate.collectionReference} already scheduled or completed for ${targetYear}-${targetMonth + 1}.`,
      mandate,
    };
  }

  return { safe: true, mandate };
}
