import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import {
  assistanceRequests,
  auditLogs,
  contactMessages,
  donations,
  financialReports,
  memberships,
  newsletterSubscribers,
  payouts,
  projects,
  successStories,
  volunteers,
} from "@/db/schema";
import { AdminDashboard, type AdminData } from "@/components/admin/admin-dashboard";
import { ensureAdminSeed, getAdminSession } from "@/lib/admin-auth";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export const dynamic = "force-dynamic";

function fmt(date: Date) {
  return date.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  await ensureAdminSeed();

  const [
    membershipRows,
    requestRows,
    volunteerRows,
    messageRows,
    subscriberRows,
    projectRows,
    reportRows,
    storyRows,
    logRows,
    donationRows,
    payoutRows,
  ] = await Promise.all([
    db.select().from(memberships).orderBy(desc(memberships.id)),
    db.select().from(assistanceRequests).orderBy(desc(assistanceRequests.id)),
    db.select().from(volunteers).orderBy(desc(volunteers.id)),
    db.select().from(contactMessages).orderBy(desc(contactMessages.id)),
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.id)),
    db.select().from(projects).orderBy(desc(projects.id)),
    db.select().from(financialReports).orderBy(desc(financialReports.id)),
    db.select().from(successStories).orderBy(desc(successStories.id)),
    db.select().from(auditLogs).orderBy(desc(auditLogs.id)).limit(100),
    db.select().from(donations).orderBy(desc(donations.id)).limit(200),
    db.select().from(payouts).orderBy(desc(payouts.id)).limit(200),
  ]);

  const succeededDonations = donationRows.filter((row) => row.status === "succeeded");
  const donationTotal = succeededDonations.reduce((sum, row) => sum + row.amount, 0);
  const releasedPayouts = payoutRows.filter((row) => row.status === "released");
  const payoutTotal = releasedPayouts.reduce((sum, row) => sum + row.amount, 0);
  const approvedMonthly = membershipRows
    .filter((row) => row.status === "approved")
    .reduce((sum, row) => sum + row.contributionAmount, 0);

  const data: AdminData = {
    stats: [
      { label: "Users", value: String(membershipRows.length) },
      { label: "Members", value: String(membershipRows.filter((row) => row.status === "approved").length) },
      { label: "Applications", value: String(requestRows.length) },
      { label: "Payments", value: String(membershipRows.filter((row) => row.status === "approved").length) },
      { label: "Projects", value: String(projectRows.length) },
      { label: "Volunteers", value: String(volunteerRows.length) },
      { label: "Partners", value: "0" },
      { label: "Reports", value: String(reportRows.length) },
      { label: "Revenue (donations)", value: formatCurrency(donationTotal / 100) },
      { label: "Expenses (payouts)", value: formatCurrency(payoutTotal / 100) },
    ],
    memberships: membershipRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      contributionAmount: row.contributionAmount,
      debitDate: row.debitDate,
      paymentMethod: row.paymentMethod,
      status: row.status,
      createdAt: fmt(row.createdAt),
    })),
    requests: requestRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      province: row.province,
      category: row.category,
      description: row.description,
      status: row.status,
      paymentStatus: row.paymentStatus,
      createdAt: fmt(row.createdAt),
    })),
    volunteers: volunteerRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      profession: row.profession,
      province: row.province,
      availability: row.availability,
    })),
    messages: messageRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      createdAt: fmt(row.createdAt),
    })),
    subscribers: subscriberRows.map((row) => ({
      id: row.id,
      email: row.email,
      createdAt: fmt(row.createdAt),
    })),
    projects: projectRows.map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      province: row.province,
      amountNeeded: row.amountNeeded,
      amountFunded: row.amountFunded,
      featured: row.featured,
    })),
    reports: reportRows.map((row) => ({
      id: row.id,
      title: row.title,
      periodLabel: row.periodLabel,
      reportType: row.reportType,
    })),
    logs: logRows.map((row) => ({
      id: row.id,
      adminEmail: row.adminEmail,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      detail: row.detail,
      createdAt: fmt(row.createdAt),
    })),
    donations: donationRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      donorName: row.donorName,
      donorEmail: row.donorEmail,
      amount: row.amount,
      status: row.status,
      isRecurring: row.isRecurring,
      createdAt: fmt(row.createdAt),
    })),
    payouts: payoutRows.map((row) => ({
      id: row.id,
      reference: row.reference,
      beneficiaryName: row.beneficiaryName,
      beneficiaryAccount: row.beneficiaryAccount,
      branchCode: row.branchCode,
      amount: row.amount,
      purpose: row.purpose,
      status: row.status,
      createdAt: fmt(row.createdAt),
    })),
  };

  return (
    <main className="min-h-screen bg-[#060606] text-[#f3efe7]">
      <AdminDashboard session={{ email: session.email, role: session.role, name: session.name }} data={data} />
    </main>
  );
}