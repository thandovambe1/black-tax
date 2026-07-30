import { db } from "@/db";
import {
  assistanceRequests,
  contactMessages,
  donations,
  financialReports,
  memberships,
  payouts,
  projects,
  successStories,
  volunteers,
} from "@/db/schema";
import { and, count, desc, eq, sql } from "drizzle-orm";

export async function getHomepageData() {
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
  ]);

  // Real money actually received (Yoco donations, stored in cents) and
  // real money actually released to service providers (payouts, in cents).
  const [donationTotals, payoutTotals] = await Promise.all([
    db
      .select({
        totalCents: sql<number>`COALESCE(SUM(${donations.amount}), 0)`,
        donorCount: count(),
      })
      .from(donations)
      .where(eq(donations.status, "succeeded")),
    db
      .select({ totalCents: sql<number>`COALESCE(SUM(${payouts.amount}), 0)` })
      .from(payouts)
      .where(eq(payouts.status, "released")),
  ]);

  const donationsReceived = Number(donationTotals[0]?.totalCents ?? 0) / 100;
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
      province: projects.province,
      funded: sql<number>`COALESCE(SUM(${projects.amountFunded}), 0)`,
    })
    .from(projects)
    .groupBy(projects.province)
    .orderBy(desc(sql<number>`COALESCE(SUM(${projects.amountFunded}), 0)`));

  const provincesSupported = provinceBreakdown.length;

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
      // Actual funds received / released through the payment gateway.
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
    },
    provinceBreakdown,
  };
}

export async function getMemberPreview(email: string) {
  return db.query.memberships.findFirst({
    where: and(eq(memberships.email, email)),
  });
}
