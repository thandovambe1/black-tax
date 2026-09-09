import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { debitCollections, debitMandates, donations, financialLedger } from "@/db/schema";
import { SA_PROVINCES, type SouthAfricanProvince } from "@/lib/payments/types";
import { getLedgerSummary } from "@/lib/ledger";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function sanitizePublicDonorName(name: string, isAnonymous: boolean): string {
  if (isAnonymous) return "Anonymous Donor";
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return `${first} ${lastInitial}.`;
}

export async function GET() {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));

  // Current South African Quarter
  const currentQMonth = Math.floor(now.getUTCMonth() / 3) * 3;
  const startOfQuarter = new Date(Date.UTC(now.getUTCFullYear(), currentQMonth, 1, 0, 0, 0));

  const [
    ledgerSummary,
    todayDonations,
    weekDonations,
    monthDonations,
    quarterDonations,
    yearDonations,
    activeRecurringMandates,
    recentVerifiedDonations,
    allVerifiedDonations,
    allCollectedDebits,
  ] = await Promise.all([
    getLedgerSummary(),
    db
      .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)` })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), gte(donations.createdAt, startOfToday))),
    db
      .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)` })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), gte(donations.createdAt, startOfWeek))),
    db
      .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)` })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), gte(donations.createdAt, startOfMonth))),
    db
      .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)` })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), gte(donations.createdAt, startOfQuarter))),
    db
      .select({ total: sql<number>`COALESCE(SUM(${donations.amount}), 0)` })
      .from(donations)
      .where(and(eq(donations.status, "SUCCEEDED"), gte(donations.createdAt, startOfYear))),
    db
      .select({
        count: sql<number>`count(*)`,
        monthlyValue: sql<number>`COALESCE(SUM(${debitMandates.amount}), 0)`,
      })
      .from(debitMandates)
      .where(sql`${debitMandates.status} IN ('ACTIVE', 'AUTHORISED')`),
    db
      .select({
        id: donations.id,
        reference: donations.reference,
        amount: donations.amount,
        donorName: donations.donorName,
        isAnonymous: donations.isAnonymous,
        province: donations.province,
        isRecurring: donations.isRecurring,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(eq(donations.status, "SUCCEEDED"))
      .orderBy(desc(donations.id))
      .limit(15),
    db
      .select({
        amount: donations.amount,
        feeAmount: donations.feeAmount,
        province: donations.province,
        isRecurring: donations.isRecurring,
      })
      .from(donations)
      .where(eq(donations.status, "SUCCEEDED")),
    db
      .select({
        amount: debitCollections.amount,
        feeAmount: debitCollections.feeAmount,
        mandateId: debitCollections.mandateId,
      })
      .from(debitCollections)
      .where(eq(debitCollections.status, "COLLECTED")),
  ]);

  // Province Breakdown
  const provinceTotals: Record<
    SouthAfricanProvince,
    {
      totalRaisedCents: number;
      netRaisedCents: number;
      donationCount: number;
      recurringCount: number;
      debitCount: number;
    }
  > = {
    "Eastern Cape": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Free State": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Gauteng": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "KwaZulu-Natal": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Limpopo": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Mpumalanga": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Northern Cape": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "North West": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
    "Western Cape": { totalRaisedCents: 0, netRaisedCents: 0, donationCount: 0, recurringCount: 0, debitCount: 0 },
  };

  for (const d of allVerifiedDonations) {
    const p = (d.province as SouthAfricanProvince) || "Gauteng";
    if (provinceTotals[p]) {
      provinceTotals[p].totalRaisedCents += d.amount;
      provinceTotals[p].netRaisedCents += d.amount - d.feeAmount;
      provinceTotals[p].donationCount += 1;
      if (d.isRecurring) provinceTotals[p].recurringCount += 1;
    }
  }

  const provinceList = SA_PROVINCES.map((province) => {
    const data = provinceTotals[province];
    const avgDonationCents =
      data.donationCount > 0 ? Math.round(data.totalRaisedCents / data.donationCount) : 0;
    const percentage =
      ledgerSummary.totalGrossCents > 0
        ? ((data.totalRaisedCents / ledgerSummary.totalGrossCents) * 100).toFixed(1)
        : "0.0";

    return {
      province,
      totalRaisedCents: data.totalRaisedCents,
      totalRaisedFormatted: formatCurrency(data.totalRaisedCents / 100),
      netRaisedCents: data.netRaisedCents,
      netRaisedFormatted: formatCurrency(data.netRaisedCents / 100),
      donationCount: data.donationCount,
      recurringCount: data.recurringCount,
      avgDonationFormatted: formatCurrency(avgDonationCents / 100),
      percentageOfTotal: `${percentage}%`,
    };
  }).sort((a, b) => b.totalRaisedCents - a.totalRaisedCents);

  // Clean Public Feed (strictly privacy compliant)
  const publicActivityFeed = recentVerifiedDonations.map((d) => ({
    id: d.id,
    displayDonor: sanitizePublicDonorName(d.donorName, d.isAnonymous),
    province: d.province,
    amountFormatted: formatCurrency(d.amount / 100),
    isRecurring: d.isRecurring,
    createdAtIso: new Date(d.createdAt).toISOString(),
  }));

  const activeMandateCount = Number(activeRecurringMandates[0]?.count ?? 0);
  const monthlyRecurringValueCents = Number(activeRecurringMandates[0]?.monthlyValue ?? 0);

  return Response.json({
    ok: true,
    ledger: {
      grossDonationsCents: ledgerSummary.grossDonationsCents,
      grossDonationsFormatted: formatCurrency(ledgerSummary.grossDonationsCents / 100),
      grossDebitsCents: ledgerSummary.grossDebitsCents,
      grossDebitsFormatted: formatCurrency(ledgerSummary.grossDebitsCents / 100),
      totalGrossCents: ledgerSummary.totalGrossCents,
      totalGrossFormatted: formatCurrency(ledgerSummary.totalGrossCents / 100),
      totalFeesCents: ledgerSummary.totalFeesCents,
      totalFeesFormatted: formatCurrency(ledgerSummary.totalFeesCents / 100),
      totalRefundsCents: ledgerSummary.totalRefundsCents,
      totalRefundsFormatted: formatCurrency(ledgerSummary.totalRefundsCents / 100),
      totalChargebacksCents: ledgerSummary.totalChargebacksCents,
      totalChargebacksFormatted: formatCurrency(ledgerSummary.totalChargebacksCents / 100),
      netRaisedCents: ledgerSummary.netRaisedCents,
      netRaisedFormatted: formatCurrency(ledgerSummary.netRaisedCents / 100),
    },
    timeframes: {
      todayCents: Number(todayDonations[0]?.total ?? 0),
      todayFormatted: formatCurrency(Number(todayDonations[0]?.total ?? 0) / 100),
      thisWeekCents: Number(weekDonations[0]?.total ?? 0),
      thisWeekFormatted: formatCurrency(Number(weekDonations[0]?.total ?? 0) / 100),
      thisMonthCents: Number(monthDonations[0]?.total ?? 0),
      thisMonthFormatted: formatCurrency(Number(monthDonations[0]?.total ?? 0) / 100),
      thisQuarterCents: Number(quarterDonations[0]?.total ?? 0),
      thisQuarterFormatted: formatCurrency(Number(quarterDonations[0]?.total ?? 0) / 100),
      thisYearCents: Number(yearDonations[0]?.total ?? 0),
      thisYearFormatted: formatCurrency(Number(yearDonations[0]?.total ?? 0) / 100),
      allTimeFormatted: formatCurrency(ledgerSummary.totalGrossCents / 100),
    },
    recurring: {
      activeMandateCount,
      monthlyRecurringValueFormatted: formatCurrency(monthlyRecurringValueCents / 100),
    },
    provinces: provinceList,
    recentActivity: publicActivityFeed,
  });
}
