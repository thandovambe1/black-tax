import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { financialLedger } from "@/db/schema";

export type LedgerEntryType =
  | "DONATION_GROSS"
  | "PAYMENT_FEE"
  | "REFUND"
  | "CHARGEBACK"
  | "DEBIT_COLLECTION_GROSS"
  | "DEBIT_COLLECTION_FEE"
  | "PAYOUT_DISBURSEMENT"
  | "ADJUSTMENT_CREDIT"
  | "ADJUSTMENT_DEBIT";

export interface RecordLedgerInput {
  entryType: LedgerEntryType;
  amountCents: number; // positive integer
  relatedEntity?: "donation" | "debit_collection" | "payout" | "adjustment";
  relatedEntityId?: number;
  description: string;
  recordedBy?: string;
}

/**
 * Appends an immutable record to the financial ledger and computes the updated balance.
 * Historical records are never modified or deleted.
 */
export async function recordLedgerEntry(input: RecordLedgerInput) {
  // 1. Fetch latest balance
  const [latest] = await db
    .select({ balance: financialLedger.balanceAfter })
    .from(financialLedger)
    .orderBy(desc(financialLedger.id))
    .limit(1);

  const currentBalance = latest?.balance ?? 0;
  const isCredit =
    input.entryType === "DONATION_GROSS" ||
    input.entryType === "DEBIT_COLLECTION_GROSS" ||
    input.entryType === "ADJUSTMENT_CREDIT";

  // Balance change: credits add funds; debits/fees/refunds/disbursements subtract funds
  const delta = isCredit ? input.amountCents : -input.amountCents;
  const balanceAfter = currentBalance + delta;

  const entryReference = `LEDGER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const [entry] = await db
    .insert(financialLedger)
    .values({
      entryReference,
      entryType: input.entryType,
      amount: input.amountCents,
      currency: "ZAR",
      balanceAfter,
      relatedEntity: input.relatedEntity,
      relatedEntityId: input.relatedEntityId,
      description: input.description,
      recordedBy: input.recordedBy ?? "system",
    })
    .returning();

  return entry;
}

/**
 * Computes official financial totals directly from verified ledger entries.
 */
export async function getLedgerSummary() {
  const [grossDonationsRow, grossDebitsRow, feesRow, refundsRow, chargebacksRow, payoutsRow, adjustmentsRow] =
    await Promise.all([
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(eq(financialLedger.entryType, "DONATION_GROSS")),
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(eq(financialLedger.entryType, "DEBIT_COLLECTION_GROSS")),
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(
          sql`${financialLedger.entryType} IN ('PAYMENT_FEE', 'DEBIT_COLLECTION_FEE')`,
        ),
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(eq(financialLedger.entryType, "REFUND")),
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(eq(financialLedger.entryType, "CHARGEBACK")),
      db
        .select({ total: sql<number>`COALESCE(SUM(${financialLedger.amount}), 0)` })
        .from(financialLedger)
        .where(eq(financialLedger.entryType, "PAYOUT_DISBURSEMENT")),
      db
        .select({
          credits: sql<number>`COALESCE(SUM(CASE WHEN ${financialLedger.entryType} = 'ADJUSTMENT_CREDIT' THEN ${financialLedger.amount} ELSE 0 END), 0)`,
          debits: sql<number>`COALESCE(SUM(CASE WHEN ${financialLedger.entryType} = 'ADJUSTMENT_DEBIT' THEN ${financialLedger.amount} ELSE 0 END), 0)`,
        })
        .from(financialLedger),
    ]);

  const grossDonationsCents = Number(grossDonationsRow[0]?.total ?? 0);
  const grossDebitsCents = Number(grossDebitsRow[0]?.total ?? 0);
  const totalGrossCents = grossDonationsCents + grossDebitsCents;
  const totalFeesCents = Number(feesRow[0]?.total ?? 0);
  const totalRefundsCents = Number(refundsRow[0]?.total ?? 0);
  const totalChargebacksCents = Number(chargebacksRow[0]?.total ?? 0);
  const totalPayoutsCents = Number(payoutsRow[0]?.total ?? 0);
  const adjustmentCredits = Number(adjustmentsRow[0]?.credits ?? 0);
  const adjustmentDebits = Number(adjustmentsRow[0]?.debits ?? 0);

  const netRaisedCents =
    totalGrossCents -
    totalFeesCents -
    totalRefundsCents -
    totalChargebacksCents +
    (adjustmentCredits - adjustmentDebits);

  const availableCashBalanceCents = netRaisedCents - totalPayoutsCents;

  return {
    grossDonationsCents,
    grossDebitsCents,
    totalGrossCents,
    totalFeesCents,
    totalRefundsCents,
    totalChargebacksCents,
    totalPayoutsCents,
    netRaisedCents,
    availableCashBalanceCents,
  };
}
