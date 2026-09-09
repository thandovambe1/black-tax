import { db } from "@/db";
import {
  assistanceRequests,
  contactMessages,
  debitCollections,
  debitMandates,
  donations,
  financialReports,
  memberships,
  payouts,
  projects,
  successStories,
  volunteers,
} from "@/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";

export type HomepageData = Awaited<ReturnType<typeof loadHomepageData>>;

/**
 * Safe zero-state used when the database is unreachable. The site must never
 * return a 500 to a donor — it renders the clean launch state instead.
 */
export function emptyHomepageData() {
  return {
    projects: [] as Awaited<ReturnType<typeof loadHomepageData>>["projects"],
    stories: [] as Awaited<ReturnType<typeof loadHomepageData>>["stories"],
    reports: [] as Awaited<ReturnType<typeof loadHomepageData>>["reports"],
    metrics: {
      totalRaised: 0,
      totalNeeded: 0,
      totalBeneficiaries: 0,
      members: 0,
      monthlyDonations: 0,
      donationsReceived: 0,
      donorCount: 0,
      fundsReleased: 0,
      distributed: 0,
      projects: 0,
      provincesSupported: 0,
      requests: 0,
      applicationsApproved: 0,
      volunteers: 0,
      inquiries: 0,
      activeMandates: 0,
    },
    provinceBreakdown: [] as { province: string; funded: number }[],
    recentVerifiedActivity: [] as {
      id: number;
      displayDonor: string;
      province: string;
      amountRand: number;
      isRecurring: boolean;
      createdAt: string;
    }[],
  };
}

/**
 * Public entry point. Never throws — a database outage degrades to the
 * zero-state rather than breaking the whole page.
 */
export async function getHomepageData() {
  if (!process.env.DATABASE_URL) {
    return emptyHomepageData();
  }
  try {
    return await loadHomepageData();
  } catch (error) {
    console.error("[data] getHomepageData failed:", error);
    return emptyHomepageData();
  }
}

async function loadHomepageData() {
  const [
    projectRows,
    storyRows,
    reportRows,
    membersApprovedRow,
    monthlyApprovedRow,
    requestCountRow,
    requestApprovedRow,
    volunteerCountRow,
    contactCountRow,
    activeMandatesRow,
  ] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.featured), desc(projects.id)).limit(4),
    db.select().from(successStories).orderBy(desc(successStories.id)).limit(3),
    db.select().from(financialReports).orderBy(desc(financialReports.publishedAt)).limit(3),
    db.select({ value: count() }).from(memberships).where(eq(memberships.status, "approved")),
    db
      .select({ value: sql<number>`COALESCE(SUM(${memberships.contributionAmount}), 0)` })
      .from(memberships)
      .where(eq(memberships.status, "approved")),
    db.select({ value: count() }).from(assistanceRequests),
    db.select({ value: count() }).from(assistanceRequests).where(eq(assistanceRequests.status, "approved")),
    db.select({ value: count() }).from(volunteers),
    db.select({ value: count() }).from(contactMessages),
    db
      .select({ count: sql<number>`count(*)` })
      .from(debitMandates)
      .where(sql`${debitMandates.status} IN ('ACTIVE', 'AUTHORISED')`),
  ]);

  // Real money actually received (card donations + settled debit collections)
  const [donationTotals, debitTotals, payoutTotals, recentDonations] = await Promise.all([
    db
      .select({
        totalCents: sql<number>`COALESCE(SUM(${donations.amount}), 0)`,
        donorCount: count(),
      })
      .from(donations)
      .where(sql`${donations.status} IN ('SUCCEEDED', 'succeeded')`),
    db
      .select({
        totalCents: sql<number>`COALESCE(SUM(${debitCollections.amount}), 0)`,
      })
      .from(debitCollections)
      .where(sql`${debitCollections.status} IN ('COLLECTED', 'collected')`),
    db
      .select({ totalCents: sql<number>`COALESCE(SUM(${payouts.amount}), 0)` })
      .from(payouts)
      .where(sql`${payouts.status} IN ('released', 'RELEASED')`),
    db
      .select({
        id: donations.id,
        donorName: donations.donorName,
        isAnonymous: donations.isAnonymous,
        province: donations.province,
        amount: donations.amount,
        isRecurring: donations.isRecurring,
        createdAt: donations.createdAt,
      })
      .from(donations)
      .where(sql`${donations.status} IN ('SUCCEEDED', 'succeeded')`)
      .orderBy(desc(donations.id))
      .limit(6),
  ]);

  const cardDonationsCents = Number(donationTotals[0]?.totalCents ?? 0);
  const debitCollectionsCents = Number(debitTotals[0]?.totalCents ?? 0);
  const totalVerifiedReceivedCents = cardDonationsCents + debitCollectionsCents;
  const donationsReceived = totalVerifiedReceivedCents / 100;
  const fundsReleased = Number(payoutTotals[0]?.totalCents ?? 0) / 100;

  const totals = await db
    .select({
      raised: sql<number>`COALESCE(SUM(${projects.amountFunded}), 0)`,
      needed: sql<number>`COALESCE(SUM(${projects.amountNeeded}), 0)`,
      beneficiaries: sql<number>`COALESCE(SUM(${projects.beneficiaries}), 0)`,
      projectCount: count(),
    })
    .from(projects);

  const provinceBreakdown = await db
    .select({
      province: donations.province,
      funded: sql<number>`COALESCE(SUM(${donations.amount}), 0) / 100`,
    })
    .from(donations)
    .where(sql`${donations.status} IN ('SUCCEEDED', 'succeeded')`)
    .groupBy(donations.province)
    .orderBy(desc(sql<number>`COALESCE(SUM(${donations.amount}), 0)`));

  const provincesSupported = provinceBreakdown.length;

  const recentVerifiedActivity = recentDonations.map((d) => {
    let displayDonor = "Anonymous Donor";
    if (!d.isAnonymous && d.donorName) {
      const parts = d.donorName.trim().split(/\s+/);
      displayDonor = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    }
    return {
      id: d.id,
      displayDonor,
      province: d.province,
      amountRand: d.amount / 100,
      isRecurring: d.isRecurring,
      createdAt: d.createdAt.toISOString(),
    };
  });

  return {
    projects: projectRows,
    stories: storyRows,
    reports: reportRows,
    metrics: {
      totalRaised: Number(totals[0]?.raised ?? 0),
      totalNeeded: Number(totals[0]?.needed ?? 0),
      totalBeneficiaries: Number(totals[0]?.beneficiaries ?? 0),
      members: membersApprovedRow[0]?.value ?? 0,
      monthlyDonations: Number(monthlyApprovedRow[0]?.value ?? 0),
      donationsReceived,
      donorCount: donationTotals[0]?.donorCount ?? 0,
      fundsReleased,
      distributed: fundsReleased,
      projects: totals[0]?.projectCount ?? 0,
      provincesSupported,
      requests: requestCountRow[0]?.value ?? 0,
      applicationsApproved: requestApprovedRow[0]?.value ?? 0,
      volunteers: volunteerCountRow[0]?.value ?? 0,
      inquiries: contactCountRow[0]?.value ?? 0,
      activeMandates: Number(activeMandatesRow[0]?.count ?? 0),
    },
    provinceBreakdown,
    recentVerifiedActivity,
  };
}

export async function getMemberPreview(email: string) {
  return db.query.memberships.findFirst({
    where: and(eq(memberships.email, email)),
  });
}
