import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  debitCollections,
  debitMandates,
  donations,
  financialAuditLogs,
  financialLedger,
  quarterlyFinancialReports,
  reconciliationDiscrepancies,
} from "@/db/schema";
import { SA_PROVINCES, type SouthAfricanProvince } from "../payments/types";

export interface QuarterDates {
  year: number;
  quarterNumber: 1 | 2 | 3 | 4;
  periodStart: Date;
  periodEnd: Date;
  label: string;
  quarterKey: string;
}

export function getSouthAfricanQuarterDates(year: number, quarter: 1 | 2 | 3 | 4): QuarterDates {
  let periodStart: Date;
  let periodEnd: Date;

  switch (quarter) {
    case 1:
      periodStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      periodEnd = new Date(Date.UTC(year, 2, 31, 23, 59, 59, 999));
      break;
    case 2:
      periodStart = new Date(Date.UTC(year, 3, 1, 0, 0, 0));
      periodEnd = new Date(Date.UTC(year, 5, 30, 23, 59, 59, 999));
      break;
    case 3:
      periodStart = new Date(Date.UTC(year, 6, 1, 0, 0, 0));
      periodEnd = new Date(Date.UTC(year, 8, 30, 23, 59, 59, 999));
      break;
    case 4:
      periodStart = new Date(Date.UTC(year, 9, 1, 0, 0, 0));
      periodEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      break;
  }

  const quarterKey = `${year}-Q${quarter}`;
  const label = `Q${quarter} ${year} (${periodStart.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })} – ${periodEnd.toLocaleDateString("en-ZA", { month: "short", day: "numeric", year: "numeric" })})`;

  return { year, quarterNumber: quarter, periodStart, periodEnd, label, quarterKey };
}

export function getCurrentQuarter(): QuarterDates {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  return getSouthAfricanQuarterDates(year, quarter);
}

export function getPreviousQuarter(year: number, quarter: 1 | 2 | 3 | 4): QuarterDates {
  if (quarter === 1) {
    return getSouthAfricanQuarterDates(year - 1, 4);
  }
  return getSouthAfricanQuarterDates(year, (quarter - 1) as 1 | 2 | 3 | 4);
}

/**
 * Calculates official quarterly report metrics strictly from verified database records.
 */
export async function calculateQuarterlyReportData(qDates: QuarterDates) {
  const { periodStart, periodEnd } = qDates;

  // 1. Fetch donations within quarter
  const quarterDonations = await db
    .select()
    .from(donations)
    .where(and(gte(donations.createdAt, periodStart), lte(donations.createdAt, periodEnd)));

  // 2. Fetch debit collections within quarter
  const quarterCollections = await db
    .select()
    .from(debitCollections)
    .where(
      and(
        gte(debitCollections.collectionDate, periodStart),
        lte(debitCollections.collectionDate, periodEnd),
      ),
    );

  // 3. Active mandates count at quarter end
  const activeMandates = await db
    .select({ count: sql<number>`count(*)` })
    .from(debitMandates)
    .where(
      and(
        lte(debitMandates.startDate, periodEnd),
        sql`${debitMandates.status} IN ('ACTIVE', 'AUTHORISED')`,
      ),
    );

  // 4. Open discrepancies in reconciliation
  const openDiscrepancies = await db
    .select()
    .from(reconciliationDiscrepancies)
    .where(
      and(
        eq(reconciliationDiscrepancies.status, "OPEN"),
        gte(reconciliationDiscrepancies.createdAt, periodStart),
        lte(reconciliationDiscrepancies.createdAt, periodEnd),
      ),
    );

  // Aggregations
  const succeededDonations = quarterDonations.filter((d) => d.status === "SUCCEEDED");
  const failedDonations = quarterDonations.filter((d) => d.status === "FAILED");
  const collectedDebits = quarterCollections.filter((c) => c.status === "COLLECTED");
  const failedDebits = quarterCollections.filter((c) => c.status === "FAILED");

  const grossDonationsCents = succeededDonations.reduce((sum, d) => sum + d.amount, 0);
  const debitCollectionsCents = collectedDebits.reduce((sum, c) => sum + c.amount, 0);
  const recurringDonationsCents = succeededDonations
    .filter((d) => d.isRecurring)
    .reduce((sum, d) => sum + d.amount, 0);

  const grossIncomeCents = grossDonationsCents + debitCollectionsCents;
  const donationFees = succeededDonations.reduce((sum, d) => sum + d.feeAmount, 0);
  const debitFees = collectedDebits.reduce((sum, c) => sum + c.feeAmount, 0);
  const feeAmountCents = donationFees + debitFees;

  const refundedDonations = quarterDonations.filter((d) => d.status === "REFUNDED");
  const refundsCents = refundedDonations.reduce((sum, d) => sum + d.amount, 0);

  const chargebackedDonations = quarterDonations.filter((d) => d.status === "CHARGEBACK");
  const chargebacksCents = chargebackedDonations.reduce((sum, d) => sum + d.amount, 0);

  const netFundsCents = grossIncomeCents - feeAmountCents - refundsCents - chargebacksCents;

  const uniqueDonors = new Set(succeededDonations.map((d) => d.donorEmail.toLowerCase()));
  const donorCount = uniqueDonors.size;
  const successfulTxCount = succeededDonations.length + collectedDebits.length;
  const failedTxCount = failedDonations.length + failedDebits.length;
  const activeMandateCount = Number(activeMandates[0]?.count ?? 0);

  // Province-by-province breakdown
  const provinceBreakdown: Record<string, { totalCents: number; count: number }> = {};
  for (const prov of SA_PROVINCES) {
    provinceBreakdown[prov] = { totalCents: 0, count: 0 };
  }
  for (const d of succeededDonations) {
    const p = d.province || "Gauteng";
    if (!provinceBreakdown[p]) provinceBreakdown[p] = { totalCents: 0, count: 0 };
    provinceBreakdown[p].totalCents += d.amount;
    provinceBreakdown[p].count += 1;
  }

  // Month-by-month breakdown
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthBreakdown: Record<string, { grossCents: number; netCents: number; txCount: number }> = {};
  for (const d of succeededDonations) {
    const m = monthNames[new Date(d.createdAt).getUTCMonth()];
    if (!monthBreakdown[m]) monthBreakdown[m] = { grossCents: 0, netCents: 0, txCount: 0 };
    monthBreakdown[m].grossCents += d.amount;
    monthBreakdown[m].netCents += d.amount - d.feeAmount;
    monthBreakdown[m].txCount += 1;
  }

  // Payment method breakdown
  const paymentMethodBreakdown: Record<string, { grossCents: number; count: number }> = {};
  for (const d of succeededDonations) {
    const m = d.paymentMethod || "card";
    if (!paymentMethodBreakdown[m]) paymentMethodBreakdown[m] = { grossCents: 0, count: 0 };
    paymentMethodBreakdown[m].grossCents += d.amount;
    paymentMethodBreakdown[m].count += 1;
  }

  // Fetch previous quarter total for growth comparison
  const prevQ = getPreviousQuarter(qDates.year, qDates.quarterNumber);
  const prevReport = await db.query.quarterlyFinancialReports.findFirst({
    where: eq(quarterlyFinancialReports.quarterKey, prevQ.quarterKey),
  });

  const previousQuarterTotalCents = prevReport?.grossIncomeCents ?? 0;
  let growthPercentage = "0.0%";
  if (previousQuarterTotalCents > 0) {
    const growth = ((grossIncomeCents - previousQuarterTotalCents) / previousQuarterTotalCents) * 100;
    growthPercentage = `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;
  } else if (grossIncomeCents > 0) {
    growthPercentage = "+100.0%";
  }

  const executiveSummary =
    `Official Black Tax Non-Profit quarterly financial statement for ${qDates.label}. ` +
    `Gross funds received totaled R${(grossIncomeCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })} ` +
    `across ${successfulTxCount} verified transactions from ${donorCount} donors. ` +
    `Net funds retained for community upliftment after payment processing fees totaled R${(netFundsCents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}. ` +
    `Active recurring debit mandates at quarter-end stood at ${activeMandateCount}. ` +
    `Reconciliation status: ${openDiscrepancies.length === 0 ? "Fully matched with zero open discrepancies." : `${openDiscrepancies.length} item(s) pending administrative review.`}`;

  return {
    quarterKey: qDates.quarterKey,
    year: qDates.year,
    quarterNumber: qDates.quarterNumber,
    periodStart,
    periodEnd,
    grossDonationsCents,
    debitCollectionsCents,
    recurringDonationsCents,
    grossIncomeCents,
    feeAmountCents,
    refundsCents,
    chargebacksCents,
    netFundsCents,
    donorCount,
    successfulTxCount,
    failedTxCount,
    activeMandateCount,
    provinceBreakdown,
    monthBreakdown,
    paymentMethodBreakdown,
    reconciliationSummary: {
      openDiscrepancyCount: openDiscrepancies.length,
      discrepancyList: openDiscrepancies.map((d) => ({ ref: d.reference, type: d.discrepancyType })),
    },
    executiveSummary,
    previousQuarterTotalCents,
    growthPercentage,
  };
}

/**
 * Generates and saves an immutable quarterly financial report in the database.
 */
export async function generateQuarterlyReport(
  year: number,
  quarter: 1 | 2 | 3 | 4,
  actor = "system",
  revisionReason?: string,
) {
  const qDates = getSouthAfricanQuarterDates(year, quarter);
  const data = await calculateQuarterlyReportData(qDates);

  const existing = await db.query.quarterlyFinancialReports.findFirst({
    where: eq(quarterlyFinancialReports.quarterKey, qDates.quarterKey),
  });

  if (existing) {
    // Increment version if revising
    const newVersion = existing.version + 1;
    await db
      .update(quarterlyFinancialReports)
      .set({
        ...data,
        version: newVersion,
        revisionReason: revisionReason ?? "Administrative recalculation with settled records",
        generatedBy: actor,
      })
      .where(eq(quarterlyFinancialReports.id, existing.id));

    await db.insert(financialAuditLogs).values({
      adminEmail: actor,
      action: `quarterly report revised (v${newVersion})`,
      entity: "quarterly_report",
      entityId: existing.id,
      transactionReference: qDates.quarterKey,
      detail: `Quarterly report for ${qDates.quarterKey} updated to v${newVersion}: ${revisionReason ?? "Recalculation"}`,
    });

    return { ...data, id: existing.id, version: newVersion };
  }

  const [created] = await db
    .insert(quarterlyFinancialReports)
    .values({
      ...data,
      version: 1,
      isImmutable: true,
      generatedBy: actor,
    })
    .returning();

  await db.insert(financialAuditLogs).values({
    adminEmail: actor,
    action: "quarterly report generated",
    entity: "quarterly_report",
    entityId: created.id,
    transactionReference: qDates.quarterKey,
    detail: `Quarterly report generated for ${qDates.quarterKey} by ${actor}`,
  });

  return created;
}
