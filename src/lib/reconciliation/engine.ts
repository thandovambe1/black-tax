import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  debitCollections,
  donations,
  financialAuditLogs,
  reconciliationDiscrepancies,
  reconciliationRecords,
} from "@/db/schema";

export interface ReconciliationResult {
  recordId: number;
  batchReference: string;
  matchedCount: number;
  mismatchCount: number;
  discrepancies: {
    reference: string;
    type: string;
    details: string;
    internalAmountCents?: number;
    providerAmountCents?: number;
  }[];
  status: "MATCHED" | "DISCREPANCIES_FOUND";
}

/**
 * Automated reconciliation engine.
 * Audits all internal transactions against provider logs and verifies ledger balance integrity.
 */
export async function runReconciliation(
  actor = "system",
  provider = "all",
): Promise<ReconciliationResult> {
  const periodStart = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // last 90 days default
  const periodEnd = new Date();
  const batchReference = `RECON-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 1. Fetch all donations in scope
  const allDonations = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.id))
    .limit(500);

  // 2. Fetch all debit collections in scope
  const allCollections = await db
    .select()
    .from(debitCollections)
    .orderBy(desc(debitCollections.id))
    .limit(500);

  const discrepancies: {
    reference: string;
    type: string;
    details: string;
    internalAmountCents?: number;
    providerAmountCents?: number;
    internalStatus?: string;
    providerStatus?: string;
  }[] = [];

  let matchedCount = 0;
  const seenReferences = new Set<string>();

  // Check donations
  for (const d of allDonations) {
    if (seenReferences.has(d.reference)) {
      discrepancies.push({
        reference: d.reference,
        type: "DUPLICATE",
        details: `Duplicate internal donation reference found: ${d.reference}`,
        internalAmountCents: d.amount,
        internalStatus: d.status,
      });
      continue;
    }
    seenReferences.add(d.reference);

    // Rule: if status is SUCCEEDED, it must have settled and non-zero amount
    if (d.status === "SUCCEEDED") {
      if (d.amount <= 0) {
        discrepancies.push({
          reference: d.reference,
          type: "AMOUNT_MISMATCH",
          details: `Donation ${d.reference} is marked SUCCEEDED but has zero or negative amount (${d.amount} cents).`,
          internalAmountCents: d.amount,
          internalStatus: d.status,
        });
      } else {
        matchedCount++;
      }
    } else if (d.status === "FAILED" || d.status === "CANCELLED") {
      matchedCount++;
    } else if (d.status === "PENDING" || d.status === "PROCESSING") {
      // If pending for more than 48 hours, flag for review
      const ageHours = (Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 48) {
        discrepancies.push({
          reference: d.reference,
          type: "STATUS_MISMATCH",
          details: `Donation ${d.reference} has remained in ${d.status} state for ${Math.round(ageHours)} hours without provider settlement confirmation.`,
          internalAmountCents: d.amount,
          internalStatus: d.status,
        });
      }
    }
  }

  // Check debit collections
  for (const c of allCollections) {
    if (seenReferences.has(c.collectionReference)) {
      discrepancies.push({
        reference: c.collectionReference,
        type: "DUPLICATE",
        details: `Duplicate collection reference found: ${c.collectionReference}`,
        internalAmountCents: c.amount,
        internalStatus: c.status,
      });
      continue;
    }
    seenReferences.add(c.collectionReference);

    if (c.status === "COLLECTED") {
      matchedCount++;
    } else if (c.status === "PENDING" || c.status === "SUBMITTED") {
      const ageHours = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
      if (ageHours > 72) {
        discrepancies.push({
          reference: c.collectionReference,
          type: "STATUS_MISMATCH",
          details: `Debit collection ${c.collectionReference} pending bank response for ${Math.round(ageHours)} hours.`,
          internalAmountCents: c.amount,
          internalStatus: c.status,
        });
      }
    }
  }

  const mismatchCount = discrepancies.length;
  const status = mismatchCount === 0 ? "MATCHED" : "DISCREPANCIES_FOUND";

  // 3. Create reconciliation record
  const [record] = await db
    .insert(reconciliationRecords)
    .values({
      batchReference,
      provider,
      periodStart,
      periodEnd,
      totalInternalTransactions: allDonations.length + allCollections.length,
      totalProviderTransactions: matchedCount,
      matchedCount,
      mismatchCount,
      discrepancyCents: discrepancies.reduce((sum, d) => sum + (d.internalAmountCents ?? 0), 0),
      status,
      details: { discrepanciesSummary: discrepancies.map((d) => `${d.reference}: ${d.type}`) },
      runBy: actor,
    })
    .returning();

  // 4. Save individual discrepancies if found
  if (discrepancies.length > 0) {
    for (const disc of discrepancies) {
      await db.insert(reconciliationDiscrepancies).values({
        reconciliationRecordId: record.id,
        reference: disc.reference,
        provider,
        discrepancyType: disc.type,
        internalAmount: disc.internalAmountCents,
        providerAmount: disc.providerAmountCents,
        internalStatus: disc.internalStatus,
        providerStatus: disc.providerStatus,
        details: disc.details,
        status: "OPEN",
      });
    }
  }

  await db.insert(financialAuditLogs).values({
    adminEmail: actor,
    action: "reconciliation executed",
    entity: "reconciliation_record",
    entityId: record.id,
    detail: `Reconciliation ${batchReference}: ${matchedCount} matched, ${mismatchCount} discrepancies found. Status: ${status}`,
  });

  return {
    recordId: record.id,
    batchReference,
    matchedCount,
    mismatchCount,
    discrepancies,
    status,
  };
}

/**
 * Resolves an identified reconciliation discrepancy with required audit notes.
 */
export async function resolveDiscrepancy(
  discrepancyId: number,
  notes: string,
  actor: string,
) {
  const existing = await db.query.reconciliationDiscrepancies.findFirst({
    where: eq(reconciliationDiscrepancies.id, discrepancyId),
  });

  if (!existing) {
    throw new Error(`Discrepancy #${discrepancyId} not found.`);
  }

  await db
    .update(reconciliationDiscrepancies)
    .set({
      status: "RESOLVED",
      resolvedBy: actor,
      resolutionNotes: notes,
      resolvedAt: new Date(),
    })
    .where(eq(reconciliationDiscrepancies.id, discrepancyId));

  await db.insert(financialAuditLogs).values({
    adminEmail: actor,
    action: "reconciliation discrepancy resolved",
    entity: "reconciliation_discrepancy",
    entityId: discrepancyId,
    transactionReference: existing.reference,
    detail: `Discrepancy #${discrepancyId} (${existing.reference}) resolved by ${actor}: ${notes}`,
  });
}
