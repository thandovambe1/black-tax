import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  debitCollections,
  debitMandates,
  donations,
  financialAdjustments,
  financialAuditLogs,
  financialLedger,
  quarterlyFinancialReports,
  reconciliationDiscrepancies,
  reconciliationRecords,
} from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { getLedgerSummary } from "@/lib/ledger";
import { formatCurrency } from "@/lib/utils";
import { SOUTH_AFRICAN_BANKS } from "@/lib/payments/bank-registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  const [
    ledgerSummary,
    allDonations,
    allMandates,
    allCollections,
    allDiscrepancies,
    latestReconRecord,
    allReports,
    recentLedgerEntries,
    recentAdjustments,
    financialLogs,
  ] = await Promise.all([
    getLedgerSummary(),
    db.select().from(donations).orderBy(desc(donations.id)).limit(100),
    db.select().from(debitMandates).orderBy(desc(debitMandates.id)).limit(100),
    db.select().from(debitCollections).orderBy(desc(debitCollections.id)).limit(100),
    db
      .select()
      .from(reconciliationDiscrepancies)
      .where(eq(reconciliationDiscrepancies.status, "OPEN"))
      .orderBy(desc(reconciliationDiscrepancies.id)),
    db.select().from(reconciliationRecords).orderBy(desc(reconciliationRecords.id)).limit(1),
    db.select().from(quarterlyFinancialReports).orderBy(desc(quarterlyFinancialReports.id)),
    db.select().from(financialLedger).orderBy(desc(financialLedger.id)).limit(50),
    db.select().from(financialAdjustments).orderBy(desc(financialAdjustments.id)).limit(50),
    db.select().from(financialAuditLogs).orderBy(desc(financialAuditLogs.id)).limit(50),
  ]);

  const succeededDonations = allDonations.filter((d) => d.status === "SUCCEEDED");
  const pendingDonations = allDonations.filter((d) => d.status === "PENDING" || d.status === "PROCESSING");
  const failedDonations = allDonations.filter((d) => d.status === "FAILED");
  const refundedDonations = allDonations.filter((d) => d.status === "REFUNDED" || d.status === "PARTIALLY_REFUNDED");
  const activeMandates = allMandates.filter((m) => m.status === "ACTIVE" || m.status === "AUTHORISED");

  return Response.json({
    ok: true,
    userRole: session.role,
    summary: {
      grossRaisedCents: ledgerSummary.totalGrossCents,
      grossRaisedFormatted: formatCurrency(ledgerSummary.totalGrossCents / 100),
      netFundsCents: ledgerSummary.netRaisedCents,
      netFundsFormatted: formatCurrency(ledgerSummary.netRaisedCents / 100),
      feesCents: ledgerSummary.totalFeesCents,
      feesFormatted: formatCurrency(ledgerSummary.totalFeesCents / 100),
      refundsCents: ledgerSummary.totalRefundsCents,
      refundsFormatted: formatCurrency(ledgerSummary.totalRefundsCents / 100),
      chargebacksCents: ledgerSummary.totalChargebacksCents,
      chargebacksFormatted: formatCurrency(ledgerSummary.totalChargebacksCents / 100),
      payoutsCents: ledgerSummary.totalPayoutsCents,
      payoutsFormatted: formatCurrency(ledgerSummary.totalPayoutsCents / 100),
      availableCashCents: ledgerSummary.availableCashBalanceCents,
      availableCashFormatted: formatCurrency(ledgerSummary.availableCashBalanceCents / 100),
      successfulCount: succeededDonations.length,
      pendingCount: pendingDonations.length,
      failedCount: failedDonations.length,
      refundedCount: refundedDonations.length,
      activeMandateCount: activeMandates.length,
      openDiscrepancyCount: allDiscrepancies.length,
      lastReconciliationStatus: latestReconRecord[0]?.status ?? "NOT_RUN",
      lastReconciliationDate: latestReconRecord[0]?.createdAt ?? null,
    },
    donations: allDonations,
    mandates: allMandates,
    collections: allCollections,
    discrepancies: allDiscrepancies,
    quarterlyReports: allReports,
    ledger: recentLedgerEntries,
    adjustments: recentAdjustments,
    auditLogs: financialLogs,
    bankRegistry: SOUTH_AFRICAN_BANKS,
  });
}
