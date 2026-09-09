"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Layers,
  Loader2,
  Lock,
  PlusCircle,
  Printer,
  RefreshCw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { SA_PROVINCES, type SouthAfricanProvince } from "@/lib/payments/types";
import { SOUTH_AFRICAN_BANKS } from "@/lib/payments/bank-registry";

export interface AdminFinanceProps {
  userRole: string;
  data: {
    summary: {
      grossRaisedCents: number;
      grossRaisedFormatted: string;
      netFundsCents: number;
      netFundsFormatted: string;
      feesCents: number;
      feesFormatted: string;
      refundsCents: number;
      refundsFormatted: string;
      chargebacksCents: number;
      chargebacksFormatted: string;
      payoutsCents: number;
      payoutsFormatted: string;
      availableCashCents: number;
      availableCashFormatted: string;
      successfulCount: number;
      pendingCount: number;
      failedCount: number;
      refundedCount: number;
      activeMandateCount: number;
      openDiscrepancyCount: number;
      lastReconciliationStatus: string;
      lastReconciliationDate: string | null;
    };
    donations: Array<{
      id: number;
      reference: string;
      provider: string;
      amount: number;
      feeAmount: number;
      netAmount: number;
      currency: string;
      status: string;
      donorName: string;
      donorEmail: string;
      donorPhone: string | null;
      province: string;
      isRecurring: boolean;
      isAnonymous: boolean;
      paymentMethod: string;
      reconciliationStatus: string;
      createdAt: string;
    }>;
    mandates: Array<{
      id: number;
      mandateReference: string;
      donorName: string;
      donorEmail: string;
      bankName: string;
      accountNumberMasked: string;
      amount: number;
      collectionDay: string;
      mandateType: string;
      status: string;
      authChannel: string | null;
      province: string;
      createdAt: string;
    }>;
    collections: Array<{
      id: number;
      collectionReference: string;
      mandateId: number;
      amount: number;
      feeAmount: number;
      status: string;
      collectionDate: string;
    }>;
    discrepancies: Array<{
      id: number;
      reference: string;
      provider: string;
      discrepancyType: string;
      internalAmount: number | null;
      providerAmount: number | null;
      internalStatus: string | null;
      providerStatus: string | null;
      details: string;
      status: string;
      createdAt: string;
    }>;
    quarterlyReports: Array<{
      id: number;
      quarterKey: string;
      year: number;
      quarterNumber: number;
      version: number;
      grossIncomeCents: number;
      feeAmountCents: number;
      refundsCents: number;
      netFundsCents: number;
      donorCount: number;
      successfulTxCount: number;
      activeMandateCount: number;
      growthPercentage: string;
      executiveSummary: string;
      provinceBreakdown: Record<string, { totalCents: number; count: number }> | null;
      createdAt: string;
    }>;
    ledger: Array<{
      id: number;
      entryReference: string;
      entryType: string;
      amount: number;
      balanceAfter: number;
      description: string;
      recordedBy: string;
      createdAt: string;
    }>;
    adjustments: Array<{
      id: number;
      adjustmentReference: string;
      originalTransactionType: string;
      reason: string;
      amount: number;
      adjustmentType: string;
      adminEmail: string;
      createdAt: string;
    }>;
    auditLogs: Array<{
      id: number;
      adminEmail: string;
      action: string;
      entity: string;
      transactionReference: string | null;
      detail: string;
      createdAt: string;
    }>;
    bankRegistry: typeof SOUTH_AFRICAN_BANKS;
  };
  onRefresh: () => void;
}

type FinanceSubTab =
  | "overview"
  | "donations"
  | "mandates"
  | "reconciliation"
  | "ledger"
  | "reports"
  | "adjustments"
  | "banks";

export function AdminFinancialDashboard({ userRole, data, onRefresh }: AdminFinanceProps) {
  const [subTab, setSubTab] = useState<FinanceSubTab>("overview");
  const [reconPending, setReconPending] = useState(false);
  const [reconMessage, setReconMessage] = useState<string | null>(null);

  // Resolution modal state
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvePending, setResolvePending] = useState(false);

  // Adjustment form state
  const [adjForm, setAdjForm] = useState({
    originalTransactionType: "donation" as "donation" | "debit_collection" | "payout" | "general",
    amountRand: "",
    adjustmentType: "credit" as "credit" | "debit",
    reason: "",
  });
  const [adjPending, setAdjPending] = useState(false);
  const [adjMessage, setAdjMessage] = useState<string | null>(null);

  // Quarterly report generation state
  const currentYear = new Date().getUTCFullYear();
  const [reportYear, setReportYear] = useState<number>(currentYear);
  const [reportQuarter, setReportQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [reportPending, setReportPending] = useState(false);
  const [selectedReportView, setSelectedReportView] = useState<(typeof data.quarterlyReports)[0] | null>(null);

  // Export filters
  const [exportProvince, setExportProvince] = useState<string>("");

  const runReconciliationHandler = async () => {
    setReconPending(true);
    setReconMessage(null);
    try {
      const res = await fetch("/api/admin/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "all" }),
      });
      const resData = (await res.json()) as { ok: boolean; message: string };
      setReconPending(false);
      setReconMessage(resData.message);
      onRefresh();
    } catch {
      setReconPending(false);
      setReconMessage("Failed to execute reconciliation.");
    }
  };

  const resolveDiscrepancyHandler = async (id: number) => {
    if (!resolutionNotes.trim()) return;
    setResolvePending(true);
    try {
      await fetch("/api/admin/reconciliation/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discrepancyId: id, notes: resolutionNotes }),
      });
      setResolvePending(false);
      setResolvingId(null);
      setResolutionNotes("");
      onRefresh();
    } catch {
      setResolvePending(false);
    }
  };

  const createAdjustmentHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjPending(true);
    setAdjMessage(null);
    try {
      const res = await fetch("/api/admin/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTransactionType: adjForm.originalTransactionType,
          amountRand: Number(adjForm.amountRand),
          adjustmentType: adjForm.adjustmentType,
          reason: adjForm.reason,
        }),
      });
      const resData = (await res.json()) as { ok: boolean; message: string };
      setAdjPending(false);
      setAdjMessage(resData.message);
      if (resData.ok) {
        setAdjForm({ originalTransactionType: "donation", amountRand: "", adjustmentType: "credit", reason: "" });
        onRefresh();
      }
    } catch {
      setAdjPending(false);
      setAdjMessage("Failed to create adjustment.");
    }
  };

  const generateReportHandler = async () => {
    setReportPending(true);
    try {
      const res = await fetch("/api/admin/reports/quarterly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: reportYear, quarterNumber: reportQuarter }),
      });
      const resData = (await res.json()) as { ok: boolean; message: string; report?: (typeof data.quarterlyReports)[0] };
      setReportPending(false);
      if (resData.ok && resData.report) {
        setSelectedReportView(resData.report);
      }
      onRefresh();
    } catch {
      setReportPending(false);
    }
  };

  const canManage = userRole === "owner" || userRole === "finance";

  return (
    <div className="space-y-8">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-white/8 pb-4">
        {[
          ["overview", "Overview & KPIs", Scale],
          ["donations", `Donations (${data.donations.length})`, CreditCard],
          ["mandates", `Debit Mandates (${data.mandates.length})`, Building2],
          ["reconciliation", `Reconciliation (${data.discrepancies.length})`, RefreshCw],
          ["ledger", "Immutable Ledger", Layers],
          ["reports", `Quarterly Reports (${data.quarterlyReports.length})`, FileText],
          ["adjustments", "Adjustments", History],
          ["banks", "SA Bank Registry", ShieldCheck],
        ].map(([key, label, Icon]) => {
          const active = subTab === key;
          const IconComp = Icon as typeof Scale;
          return (
            <button
              key={key as string}
              type="button"
              onClick={() => setSubTab(key as FinanceSubTab)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-[#d6c3a1] text-black shadow-md"
                  : "border border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <IconComp className="h-3.5 w-3.5" />
              {label as string}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW & KPIS */}
      {subTab === "overview" && (
        <div className="space-y-8">
          {/* Main KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Total Gross Raised</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.summary.grossRaisedFormatted}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-2">
                <span>Verified donations + debits</span>
                <span className="font-semibold text-emerald-400">{data.summary.successfulCount} settled</span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#d6c3a1]/30 bg-[#d6c3a1]/5 p-5 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Net Funds for Community</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.summary.netFundsFormatted}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-2">
                <span>Fees deducted: {data.summary.feesFormatted}</span>
                <span className="text-[#d6c3a1]">Available</span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Payouts Released</p>
              <p className="mt-2 text-2xl font-bold text-white">{data.summary.payoutsFormatted}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-2">
                <span>Disbursed to service providers</span>
                <span>FNB Rail</span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Reconciliation Health</p>
              <div className="mt-2 flex items-center gap-2">
                {data.summary.openDiscrepancyCount === 0 ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-400">100% Matched</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-5 w-5 text-amber-400" />
                    <span className="text-lg font-bold text-amber-400">{data.summary.openDiscrepancyCount} Pending Review</span>
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/40 border-t border-white/5 pt-2">
                <span>Active Mandates: {data.summary.activeMandateCount}</span>
                <button
                  type="button"
                  onClick={() => setSubTab("reconciliation")}
                  className="text-[#d6c3a1] hover:underline"
                >
                  Audit View
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Financial Breakdown Card */}
          <div className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Financial Integrity Ledger</p>
                <h3 className="mt-1 text-lg font-semibold text-white">Full Double-Entry Accounting Position</h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/admin/finance/export"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" /> Export Ledger CSV
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-white/50">Gross Income (All Rails)</p>
                <p className="mt-1 text-xl font-semibold text-white">{data.summary.grossRaisedFormatted}</p>
                <p className="mt-2 text-[0.7rem] text-white/40">Donations + Debit Collections</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-white/50">Processing Fees</p>
                <p className="mt-1 text-xl font-semibold text-amber-300">-{data.summary.feesFormatted}</p>
                <p className="mt-2 text-[0.7rem] text-white/40">Yoco & Debit bureau fees</p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <p className="text-xs text-white/50">Refunds & Chargebacks</p>
                <p className="mt-1 text-xl font-semibold text-red-300">-{data.summary.refundsFormatted}</p>
                <p className="mt-2 text-[0.7rem] text-white/40">Chargebacks: {data.summary.chargebacksFormatted}</p>
              </div>
              <div className="rounded-2xl border border-[#d6c3a1]/20 bg-[#d6c3a1]/5 p-4">
                <p className="text-xs text-[#d6c3a1]">Retained Balance</p>
                <p className="mt-1 text-xl font-semibold text-white">{data.summary.availableCashFormatted}</p>
                <p className="mt-2 text-[0.7rem] text-white/40">Net after payouts released</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DONATIONS TRANSACTIONS */}
      {subTab === "donations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Card & Online Donations</p>
              <h3 className="text-lg font-semibold text-white">Verified Incoming Transactions</h3>
            </div>
            <a
              href="/api/admin/finance/export"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <Download className="h-3.5 w-3.5" /> Download Transactions CSV
            </a>
          </div>

          {data.donations.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              No donation transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.75rem] border border-white/8 bg-[#0d0d0d]">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="border-b border-white/8 bg-white/[0.02] text-[0.7rem] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Donor</th>
                    <th className="px-4 py-3.5">Province</th>
                    <th className="px-4 py-3.5">Gross (ZAR)</th>
                    <th className="px-4 py-3.5">Fee</th>
                    <th className="px-4 py-3.5">Net</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Reconciliation</th>
                    <th className="px-4 py-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.donations.map((d) => (
                    <tr key={d.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono font-medium text-white">{d.reference}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{d.isAnonymous ? "Anonymous" : d.donorName}</p>
                        <p className="text-[0.65rem] text-white/40">{d.donorEmail}</p>
                      </td>
                      <td className="px-4 py-3">{d.province}</td>
                      <td className="px-4 py-3 font-semibold text-white">{formatCurrency(d.amount / 100)}</td>
                      <td className="px-4 py-3 text-amber-300">-{formatCurrency(d.feeAmount / 100)}</td>
                      <td className="px-4 py-3 text-emerald-300">{formatCurrency(d.netAmount / 100)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                            d.status === "SUCCEEDED"
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                              : d.status === "FAILED"
                                ? "bg-red-400/10 text-red-400 border border-red-400/20"
                                : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[0.7rem] text-white/50">{d.reconciliationStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40">{d.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. DEBIT MANDATES */}
      {subTab === "mandates" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">DebiCheck & Debit Orders</p>
            <h3 className="text-lg font-semibold text-white">Registered Customer Mandates</h3>
          </div>

          {data.mandates.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              No debit mandates registered yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.75rem] border border-white/8 bg-[#0d0d0d]">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="border-b border-white/8 bg-white/[0.02] text-[0.7rem] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3.5">Mandate Ref</th>
                    <th className="px-4 py-3.5">Donor</th>
                    <th className="px-4 py-3.5">Bank</th>
                    <th className="px-4 py-3.5">Account (Masked)</th>
                    <th className="px-4 py-3.5">Monthly Amount</th>
                    <th className="px-4 py-3.5">Debit Day</th>
                    <th className="px-4 py-3.5">Rail</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.mandates.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono font-medium text-white">{m.mandateReference}</td>
                      <td className="px-4 py-3 font-medium text-white">{m.donorName}</td>
                      <td className="px-4 py-3">{m.bankName}</td>
                      <td className="px-4 py-3 font-mono text-white/60">{m.accountNumberMasked}</td>
                      <td className="px-4 py-3 font-semibold text-white">{formatCurrency(m.amount / 100)}</td>
                      <td className="px-4 py-3">{m.collectionDay}</td>
                      <td className="px-4 py-3 uppercase text-[0.65rem] text-white/50">{m.mandateType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                            m.status === "ACTIVE" || m.status === "AUTHORISED"
                              ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                              : "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40">{m.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. RECONCILIATION ENGINE */}
      {subTab === "reconciliation" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Automated Reconciliation</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Provider Settlement Audit Engine</h3>
              <p className="mt-1 text-xs text-white/50">
                Audits all internal donation records, gateway event streams, and debit-order bureau collections to detect mismatches.
              </p>
            </div>
            {canManage && (
              <button
                type="button"
                disabled={reconPending}
                onClick={runReconciliationHandler}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-60"
              >
                {reconPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Run Reconciliation Audit
              </button>
            )}
          </div>

          {reconMessage && (
            <div className="rounded-2xl border border-[#d6c3a1]/30 bg-[#d6c3a1]/10 p-4 text-xs text-white">
              {reconMessage}
            </div>
          )}

          {/* Discrepancies Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Open Discrepancies ({data.discrepancies.length})</h4>
            {data.discrepancies.length === 0 ? (
              <div className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/5 p-8 text-center text-xs text-emerald-300">
                <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
                Zero open reconciliation discrepancies. All transactions match verified provider evidence.
              </div>
            ) : (
              <div className="space-y-3">
                {data.discrepancies.map((disc) => (
                  <div key={disc.id} className="rounded-2xl border border-amber-400/30 bg-[#0d0d0d] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-amber-400/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber-400">
                            {disc.discrepancyType}
                          </span>
                          <span className="font-mono text-xs text-white">{disc.reference}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-white/70">{disc.details}</p>
                        <p className="mt-1 text-[0.65rem] text-white/40">Logged: {disc.createdAt}</p>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setResolvingId(disc.id)}
                          className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                        >
                          Resolve Issue
                        </button>
                      )}
                    </div>

                    {resolvingId === disc.id && (
                      <div className="mt-4 border-t border-white/8 pt-4">
                        <textarea
                          rows={2}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Provide audit resolution notes (mandatory)..."
                          className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-white outline-none focus:border-[#d6c3a1]"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setResolvingId(null)}
                            className="rounded-full px-3 py-1 text-xs text-white/50 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={resolvePending || !resolutionNotes.trim()}
                            onClick={() => resolveDiscrepancyHandler(disc.id)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-semibold text-black hover:bg-emerald-300 disabled:opacity-50"
                          >
                            {resolvePending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Confirm Resolution
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. IMMUTABLE FINANCIAL LEDGER */}
      {subTab === "ledger" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Double-Entry Accounting Log</p>
            <h3 className="text-lg font-semibold text-white">Immutable Financial Ledger</h3>
            <p className="mt-1 text-xs text-white/50">
              Append-only financial movement register. Records cannot be overwritten or edited.
            </p>
          </div>

          {data.ledger.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 p-12 text-center text-sm text-white/50">
              No financial ledger entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.75rem] border border-white/8 bg-[#0d0d0d]">
              <table className="w-full text-left text-xs text-white/70">
                <thead className="border-b border-white/8 bg-white/[0.02] text-[0.7rem] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-4 py-3.5">Entry Reference</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Amount (ZAR)</th>
                    <th className="px-4 py-3.5">Balance After</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5">Actor</th>
                    <th className="px-4 py-3.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono font-medium text-white">{entry.entryReference}</td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-white/70">
                          {entry.entryType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{formatCurrency(entry.amount / 100)}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{formatCurrency(entry.balanceAfter / 100)}</td>
                      <td className="px-4 py-3 text-white/60">{entry.description}</td>
                      <td className="px-4 py-3 text-[0.65rem] text-white/40">{entry.recordedBy}</td>
                      <td className="px-4 py-3 text-white/40">{entry.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. QUARTERLY FINANCIAL REPORTS */}
      {subTab === "reports" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Official Statutory Reporting</p>
              <h3 className="mt-1 text-lg font-semibold text-white">South African Quarterly Financial Reports</h3>
              <p className="mt-1 text-xs text-white/50">
                Q1 (Jan–Mar), Q2 (Apr–Jun), Q3 (Jul–Sep), Q4 (Oct–Dec). Generated strictly from verified database records.
              </p>
            </div>
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white"
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y} className="bg-[#0d0d0d]">{y}</option>
                  ))}
                </select>
                <select
                  value={reportQuarter}
                  onChange={(e) => setReportQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs text-white"
                >
                  <option value={1} className="bg-[#0d0d0d]">Q1 (Jan – Mar)</option>
                  <option value={2} className="bg-[#0d0d0d]">Q2 (Apr – Jun)</option>
                  <option value={3} className="bg-[#0d0d0d]">Q3 (Jul – Sep)</option>
                  <option value={4} className="bg-[#0d0d0d]">Q4 (Oct – Dec)</option>
                </select>
                <button
                  type="button"
                  disabled={reportPending}
                  onClick={generateReportHandler}
                  className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-4 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
                >
                  {reportPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                  Generate Report
                </button>
              </div>
            )}
          </div>

          {/* Generated Reports List */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.quarterlyReports.map((report) => (
              <div key={report.id} className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[#d6c3a1]/10 px-2.5 py-1 font-mono text-xs font-bold text-[#d6c3a1]">
                    {report.quarterKey} (v{report.version})
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">{report.growthPercentage}</span>
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-white/50">Gross Funds: {formatCurrency(report.grossIncomeCents / 100)}</p>
                  <p className="text-xs text-white/50">Net Funds: {formatCurrency(report.netFundsCents / 100)}</p>
                  <p className="text-xs text-white/50">Supporters: {report.donorCount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReportView(report)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <FileText className="h-3.5 w-3.5" /> View Official Statement
                </button>
              </div>
            ))}
          </div>

          {/* Detailed Statement Modal / View */}
          {selectedReportView && (
            <div className="rounded-[2rem] border border-[#d6c3a1]/30 bg-[#0d0d0d] p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#d6c3a1]">Official Financial Report</p>
                  <h3 className="text-xl font-bold text-white">
                    Black Tax Non-Profit — Statement for {selectedReportView.quarterKey}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white hover:bg-white/10"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReportView(null)}
                    className="rounded-full p-2 text-white/50 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-xs leading-6 text-white/80">
                <p className="font-semibold text-[#d6c3a1] uppercase tracking-wider mb-1">Executive Summary</p>
                <p>{selectedReportView.executiveSummary}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/50">Gross Donations</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedReportView.grossIncomeCents / 100)}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs text-white/50">Payment Gateway Fees</p>
                  <p className="text-lg font-bold text-amber-300">-{formatCurrency(selectedReportView.feeAmountCents / 100)}</p>
                </div>
                <div className="rounded-2xl border border-[#d6c3a1]/20 bg-[#d6c3a1]/5 p-4">
                  <p className="text-xs text-[#d6c3a1]">Net Retained Funds</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(selectedReportView.netFundsCents / 100)}</p>
                </div>
              </div>

              <div className="text-xs text-white/40 border-t border-white/5 pt-4 flex justify-between">
                <span>Version: {selectedReportView.version} · Immutable Public Benefit Statement</span>
                <span>Generated: {selectedReportView.createdAt}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. ADJUSTMENTS */}
      {subTab === "adjustments" && (
        <div className="space-y-6">
          {canManage && (
            <form onSubmit={createAdjustmentHandler} className="rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">Controlled Financial Corrections</p>
                <h3 className="text-base font-semibold text-white">Create Financial Adjustment</h3>
                <p className="text-xs text-white/50">
                  Historical transactions are never directly edited. All balance adjustments require documented audit justification.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-medium text-white/60">
                  Adjustment Type
                  <select
                    value={adjForm.adjustmentType}
                    onChange={(e) => setAdjForm({ ...adjForm, adjustmentType: e.target.value as "credit" | "debit" })}
                    className="mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] p-3 text-xs text-white"
                  >
                    <option value="credit" className="bg-[#0d0d0d]">Credit (Add Funds)</option>
                    <option value="debit" className="bg-[#0d0d0d]">Debit (Deduct Funds)</option>
                  </select>
                </label>
                <label className="block text-xs font-medium text-white/60">
                  Amount (ZAR)
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adjForm.amountRand}
                    onChange={(e) => setAdjForm({ ...adjForm, amountRand: e.target.value })}
                    placeholder="e.g. 500.00"
                    className="mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] p-3 text-xs text-white"
                  />
                </label>
                <label className="block text-xs font-medium text-white/60">
                  Related Entity
                  <select
                    value={adjForm.originalTransactionType}
                    onChange={(e) =>
                      setAdjForm({
                        ...adjForm,
                        originalTransactionType: e.target.value as typeof adjForm.originalTransactionType,
                      })
                    }
                    className="mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] p-3 text-xs text-white"
                  >
                    <option value="donation" className="bg-[#0d0d0d]">Donation Transaction</option>
                    <option value="debit_collection" className="bg-[#0d0d0d]">Debit Collection</option>
                    <option value="payout" className="bg-[#0d0d0d]">Disbursement Payout</option>
                    <option value="general" className="bg-[#0d0d0d]">General Bank Correction</option>
                  </select>
                </label>
              </div>

              <label className="block text-xs font-medium text-white/60">
                Audit Reason (Mandatory justification)
                <textarea
                  required
                  rows={2}
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })}
                  placeholder="Explain why this adjustment is necessary..."
                  className="mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] p-3 text-xs text-white"
                />
              </label>

              <button
                type="submit"
                disabled={adjPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-xs font-semibold text-black hover:bg-white disabled:opacity-50"
              >
                {adjPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                Record Ledger Adjustment
              </button>

              {adjMessage && <p className="text-xs text-white/70">{adjMessage}</p>}
            </form>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Recorded Adjustments ({data.adjustments.length})</h4>
            {data.adjustments.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/10 p-8 text-center text-xs text-white/50">
                No manual financial adjustments on record.
              </div>
            ) : (
              <div className="space-y-3">
                {data.adjustments.map((adj) => (
                  <div key={adj.id} className="rounded-2xl border border-white/8 bg-[#0d0d0d] p-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-mono font-bold text-white">{adj.adjustmentReference}</p>
                      <p className="text-white/60 mt-1">{adj.reason}</p>
                      <p className="text-[0.65rem] text-white/40 mt-1">{adj.adminEmail} · {adj.createdAt}</p>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${adj.adjustmentType === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                        {adj.adjustmentType === "credit" ? "+" : "-"}{formatCurrency(adj.amount / 100)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. SA BANK REGISTRY */}
      {subTab === "banks" && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">South African Banking Directory</p>
            <h3 className="text-lg font-semibold text-white">Configured Bank Capabilities & Debit Rails</h3>
            <p className="mt-1 text-xs text-white/50">
              Registered South African banks supported through regulated payment and debit-order bureau interfaces.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.bankRegistry.map((bank) => (
              <div key={bank.bankCode} className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">{bank.bankName}</h4>
                  <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-[0.65rem] text-[#d6c3a1]">
                    {bank.universalBranchCode}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-white/60">
                  <p className="flex items-center gap-1.5">
                    <Check className={`h-3.5 w-3.5 ${bank.supportsDebiCheck ? "text-emerald-400" : "text-white/20"}`} />
                    DebiCheck: {bank.supportsDebiCheck ? "Supported" : "Not supported"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className={`h-3.5 w-3.5 ${bank.supportsRegisteredMandate ? "text-emerald-400" : "text-white/20"}`} />
                    Registered Mandate: {bank.supportsRegisteredMandate ? "Supported" : "Not supported"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Check className={`h-3.5 w-3.5 ${bank.supportsEFT ? "text-emerald-400" : "text-white/20"}`} />
                    EFT Debit: {bank.supportsEFT ? "Supported" : "Not supported"}
                  </p>
                </div>
                <div className="mt-3 border-t border-white/5 pt-2 text-[0.65rem] text-white/40">
                  Channels: {bank.supportedChannels.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
