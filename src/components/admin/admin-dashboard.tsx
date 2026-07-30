"use client";

import { Check, Loader2, LogOut, Megaphone, ScrollText, Users, Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AdminData = {
  stats: { label: string; value: string }[];
  memberships: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    contributionAmount: number;
    debitDate: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
  }[];
  requests: {
    id: number;
    fullName: string;
    email: string;
    province: string;
    category: string;
    description: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
  volunteers: { id: number; fullName: string; email: string; profession: string; province: string; availability: string }[];
  messages: { id: number; name: string; email: string; subject: string; message: string; createdAt: string }[];
  subscribers: { id: number; email: string; createdAt: string }[];
  projects: { id: number; title: string; category: string; province: string; amountNeeded: number; amountFunded: number; featured: boolean }[];
  reports: { id: number; title: string; periodLabel: string; reportType: string }[];
  logs: { id: number; adminEmail: string; action: string; entity: string; entityId: number | null; detail: string; createdAt: string }[];
  donations: {
    id: number;
    reference: string;
    donorName: string;
    donorEmail: string;
    amount: number;
    status: string;
    isRecurring: boolean;
    createdAt: string;
  }[];
  payouts: {
    id: number;
    reference: string;
    beneficiaryName: string;
    beneficiaryAccount: string;
    branchCode: string;
    amount: number;
    purpose: string;
    status: string;
    createdAt: string;
  }[];
};

const ALL_TABS = ["Donations", "Assistance", "Payments", "Payouts", "Publish", "Community", "Audit Logs"] as const;
type Tab = (typeof ALL_TABS)[number];

function tabsForRole(role: string): Tab[] {
  if (role === "finance") {
    // Finance sees everything admin related, focused on finance/payments.
    return ["Payouts", "Payments", "Donations", "Assistance", "Community", "Audit Logs"];
  }
  if (role === "owner") {
    // Owner does everything admin + finance can do.
    return ["Donations", "Assistance", "Payments", "Payouts", "Publish", "Community", "Audit Logs"];
  }
  // Admin sees everything admin related (no finance payout release).
  return ["Donations", "Assistance", "Payments", "Payouts", "Publish", "Community", "Audit Logs"];
}

function PaymentBadge({ status }: { status: string }) {
  const styles =
    status === "released"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "processing"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
        : "border-white/15 bg-white/[0.04] text-white/50";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}

function PaymentButtons({ id, paymentStatus, onDone }: { id: number; paymentStatus: string; onDone: () => void }) {
  const [pending, setPending] = useState<string | null>(null);

  const act = async (action: "processing" | "released") => {
    setPending(action);
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setPending(null);
    onDone();
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => act("processing")}
        disabled={pending !== null || paymentStatus === "processing" || paymentStatus === "released"}
        className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-400/10 px-3.5 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending === "processing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        Mark processing
      </button>
      <button
        type="button"
        onClick={() => act("released")}
        disabled={pending !== null || paymentStatus === "released"}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending === "released" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Release to provider
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "approved"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "declined"
        ? "border-red-400/30 bg-red-400/10 text-red-300"
        : "border-[#d6c3a1]/30 bg-[#d6c3a1]/10 text-[#d6c3a1]";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}

function DecisionButtons({
  entity,
  id,
  status,
  onDone,
}: {
  entity: "membership" | "assistance";
  id: number;
  status: string;
  onDone: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);

  const act = async (action: "approve" | "decline") => {
    setPending(action);
    await fetch("/api/admin/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id, action }),
    });
    setPending(null);
    onDone();
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => act("approve")}
        disabled={pending !== null || status === "approved"}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending === "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        type="button"
        onClick={() => act("decline")}
        disabled={pending !== null || status === "declined"}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-3.5 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending === "decline" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Decline
      </button>
    </div>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50";

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-xs font-medium text-white/60">
      {label}
      <input className={inputClass} {...props} />
    </label>
  );
}

function PublishProjectForm({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Education",
    province: "Gauteng",
    location: "",
    summary: "",
    impact: "",
    amountNeeded: "100000",
    amountFunded: "0",
    beneficiaries: "0",
    imageUrl: "",
    featured: false,
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "project",
        ...form,
        amountNeeded: Number(form.amountNeeded),
        amountFunded: Number(form.amountFunded),
        beneficiaries: Number(form.beneficiaries),
      }),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">Publish a Project</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Field label="Category" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Field label="Province" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
        <Field label="Location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <Field label="Amount needed (R)" type="number" min={1} required value={form.amountNeeded} onChange={(e) => setForm({ ...form, amountNeeded: e.target.value })} />
        <Field label="Amount funded (R)" type="number" min={0} value={form.amountFunded} onChange={(e) => setForm({ ...form, amountFunded: e.target.value })} />
        <Field label="Beneficiaries" type="number" min={0} value={form.beneficiaries} onChange={(e) => setForm({ ...form, beneficiaries: e.target.value })} />
        <Field label="Image URL" type="url" required placeholder="https://…" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
      </div>
      <Field label="Summary" required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      <Field label="Impact statement" required value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} />
      <label className="flex items-center gap-2 text-xs text-white/60">
        <input type="checkbox" className="accent-[#d6c3a1]" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
        Feature this project on the homepage
      </label>
      <button type="submit" disabled={pending} className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-60">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Megaphone className="h-3.5 w-3.5" />} Publish Project
      </button>
      {message ? <p className="text-xs text-white/55">{message}</p> : null}
    </form>
  );
}

function PublishReportForm({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", periodLabel: "", reportType: "Monthly Report", summary: "", fileUrl: "#" });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "report", ...form }),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">Publish a Financial Report</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Field label="Period (e.g. July 2026)" required value={form.periodLabel} onChange={(e) => setForm({ ...form, periodLabel: e.target.value })} />
        <Field label="Report type" required value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })} />
        <Field label="File URL" required value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
      </div>
      <Field label="Summary" required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      <button type="submit" disabled={pending} className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-60">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScrollText className="h-3.5 w-3.5" />} Publish Report
      </button>
      {message ? <p className="text-xs text-white/55">{message}</p> : null}
    </form>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const styles =
    status === "released"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
      : status === "processing"
        ? "border-sky-400/30 bg-sky-400/10 text-sky-300"
        : status === "failed"
          ? "border-red-400/30 bg-red-400/10 text-red-300"
          : "border-[#d6c3a1]/30 bg-[#d6c3a1]/10 text-[#d6c3a1]";
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${styles}`}>{status}</span>;
}

function CreatePayoutForm({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    beneficiaryName: "",
    beneficiaryAccount: "",
    branchCode: "",
    amount: "",
    purpose: "",
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaryName: form.beneficiaryName,
        beneficiaryAccount: form.beneficiaryAccount,
        branchCode: form.branchCode,
        amount: Number(form.amount),
        purpose: form.purpose,
      }),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) {
      setForm({ beneficiaryName: "", beneficiaryAccount: "", branchCode: "", amount: "", purpose: "" });
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">Create a payout to a service provider (FNB)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Beneficiary name" required value={form.beneficiaryName} onChange={(e) => setForm({ ...form, beneficiaryName: e.target.value })} />
        <Field label="Account number" required value={form.beneficiaryAccount} onChange={(e) => setForm({ ...form, beneficiaryAccount: e.target.value })} />
        <Field label="Branch code" required value={form.branchCode} onChange={(e) => setForm({ ...form, branchCode: e.target.value })} />
        <Field label="Amount (R)" type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      </div>
      <Field label="Purpose / reference" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
      <button type="submit" disabled={pending} className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#f3efe7] px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-white disabled:opacity-60">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />} Create payout
      </button>
      {message ? <p className="text-xs text-white/55">{message}</p> : null}
    </form>
  );
}

function ReleasePayoutButton({ id, status, onDone }: { id: number; status: string; onDone: () => void }) {
  const [pending, setPending] = useState(false);

  const release = async () => {
    setPending(true);
    await fetch("/api/admin/payouts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPending(false);
    onDone();
  };

  return (
    <button
      type="button"
      onClick={release}
      disabled={pending || status === "released"}
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
      Release via FNB
    </button>
  );
}

export function AdminDashboard({ session, data }: { session: { email: string; role: string; name: string }; data: AdminData }) {
  const router = useRouter();
  const tabs = tabsForRole(session.role);
  const canManagePayments = session.role === "owner" || session.role === "finance";
  const [tab, setTab] = useState<Tab>(tabs[0]);

  const refresh = () => router.refresh();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6c3a1]">Admin Portal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
            Welcome, {session.name}
            <span className="ml-3 rounded-full border border-[#d6c3a1]/30 bg-[#d6c3a1]/10 px-3 py-1 align-middle text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">
              {session.role}
            </span>
          </h1>
        </div>
        <button
          type="button"
          onClick={logout}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition hover:border-red-400/40 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.map((stat) => (
          <div key={stat.label} className="rounded-[1.6rem] border border-white/8 bg-[#0d0d0d] p-5">
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              tab === item
                ? "bg-[#f3efe7] text-black"
                : "border border-white/12 bg-white/[0.03] text-white/60 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Donations" ? (
        <section className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-[#d6c3a1]" />
            <h2 className="text-lg font-semibold text-white">Card donations via Yoco ({data.donations.length})</h2>
          </div>
          {data.donations.length === 0 ? (
            <p className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6 text-sm text-white/50">No card donations yet.</p>
          ) : (
            <div className="grid gap-3">
              {data.donations.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-[#0d0d0d] p-4">
                  <div>
                    <p className="font-semibold text-white">
                      {d.donorName} <span className="text-white/40">· {d.reference}</span>
                    </p>
                    <p className="text-xs text-white/45">
                      {d.donorEmail} · {d.isRecurring ? "Monthly" : "Once-off"} · {d.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">R{(d.amount / 100).toFixed(2)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <Wallet className="h-5 w-5 text-[#d6c3a1]" />
            <h2 className="text-lg font-semibold text-white">Debit-order membership pledges ({data.memberships.length})</h2>
          </div>
          {data.memberships.length === 0 ? (
            <p className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6 text-sm text-white/50">No donation pledges yet.</p>
          ) : (
            <div className="grid gap-4">
              {data.memberships.map((member) => (
                <div key={member.id} className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {member.fullName} <span className="text-white/40">· #{member.id}</span>
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        R{member.contributionAmount}/month · Debit {member.debitDate} · {member.paymentMethod}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {member.email} · {member.phone} · {member.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={member.status} />
                      <DecisionButtons entity="membership" id={member.id} status={member.status} onDone={refresh} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "Assistance" ? (
        <section className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#d6c3a1]" />
            <h2 className="text-lg font-semibold text-white">Assistance requests ({data.requests.length})</h2>
          </div>
          {data.requests.length === 0 ? (
            <p className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6 text-sm text-white/50">No assistance requests yet.</p>
          ) : (
            <div className="grid gap-4">
              {data.requests.map((req) => (
                <div key={req.id} className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="font-semibold text-white">
                        {req.fullName} <span className="text-white/40">· #{req.id}</span>
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        {req.category} · {req.province} · {req.email}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/60">{req.description}</p>
                      <p className="mt-1 text-xs text-white/40">{req.createdAt}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={req.status} />
                      <DecisionButtons entity="assistance" id={req.id} status={req.status} onDone={refresh} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "Payments" ? (
        <section className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-[#d6c3a1]" />
            <h2 className="text-lg font-semibold text-white">Payments to service providers</h2>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-white/55">
            Approved assistance requests must have their payments made and released to the relevant service providers.
            Mark each payment as processing while it is being prepared, then release it once funds have been paid out.
          </p>
          {(() => {
            const payable = data.requests.filter((req) => req.status === "approved");
            if (payable.length === 0) {
              return (
                <p className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6 text-sm text-white/50">
                  No approved requests are awaiting payment yet.
                </p>
              );
            }
            return (
              <div className="grid gap-4">
                {payable.map((req) => (
                  <div key={req.id} className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <p className="font-semibold text-white">
                          {req.fullName} <span className="text-white/40">· #{req.id}</span>
                        </p>
                        <p className="mt-1 text-sm text-white/55">
                          {req.category} · {req.province} · {req.email}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/60">{req.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <PaymentBadge status={req.paymentStatus} />
                        {canManagePayments ? (
                          <PaymentButtons id={req.id} paymentStatus={req.paymentStatus} onDone={refresh} />
                        ) : (
                          <span className="text-xs text-white/40">View only</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      ) : null}

      {tab === "Payouts" ? (
        <section className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-[#d6c3a1]" />
              <h2 className="text-lg font-semibold text-white">Payouts to service providers ({data.payouts.length})</h2>
            </div>
            {canManagePayments ? (
              <a
                href="/api/admin/payouts/export"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#d6c3a1]/40 hover:bg-white/[0.07]"
              >
                <ScrollText className="h-3.5 w-3.5" /> Export FNB batch file
              </a>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-white/55">
            Funds are released to verified service providers through FNB. Create a payout, then release it — either
            directly through the FNB API (if configured) or via the exported FNB batch file for upload in FNB Online
            Banking. Every payout is recorded with a full audit trail.
          </p>

          {canManagePayments ? <CreatePayoutForm onDone={refresh} /> : null}

          {data.payouts.length === 0 ? (
            <p className="rounded-[1.5rem] border border-white/8 bg-white/[0.02] p-6 text-sm text-white/50">No payouts yet.</p>
          ) : (
            <div className="grid gap-3">
              {data.payouts.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/8 bg-[#0d0d0d] p-4">
                  <div>
                    <p className="font-semibold text-white">
                      {p.beneficiaryName} <span className="text-white/40">· {p.reference}</span>
                    </p>
                    <p className="text-xs text-white/45">
                      Acc {p.beneficiaryAccount} · Branch {p.branchCode}
                      {p.purpose ? ` · ${p.purpose}` : ""} · {p.createdAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white">R{(p.amount / 100).toFixed(2)}</span>
                    <PayoutStatusBadge status={p.status} />
                    {canManagePayments ? <ReleasePayoutButton id={p.id} status={p.status} onDone={refresh} /> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "Publish" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <PublishProjectForm onDone={refresh} />
          <div className="space-y-6">
            <PublishReportForm onDone={refresh} />
            <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white">Currently live</p>
              <p className="mt-2 text-xs text-white/50">{data.projects.length} projects · {data.reports.length} reports</p>
              <ul className="mt-3 space-y-2 text-xs text-white/55">
                {data.projects.slice(0, 6).map((project) => (
                  <li key={project.id}>
                    {project.title} — {project.category}, {project.province}
                    {project.featured ? <span className="ml-2 text-[#d6c3a1]">★ featured</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "Community" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
            <h3 className="font-semibold text-white">Volunteers ({data.volunteers.length})</h3>
            <ul className="mt-3 space-y-3 text-sm text-white/60">
              {data.volunteers.length === 0 ? <li className="text-white/40">None yet.</li> : null}
              {data.volunteers.map((vol) => (
                <li key={vol.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-3">
                  <p className="font-medium text-white/85">{vol.fullName}</p>
                  <p className="text-xs text-white/45">{vol.profession} · {vol.province} · {vol.availability}</p>
                  <p className="text-xs text-white/40">{vol.email}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
            <h3 className="font-semibold text-white">Contact messages ({data.messages.length})</h3>
            <ul className="mt-3 space-y-3 text-sm text-white/60">
              {data.messages.length === 0 ? <li className="text-white/40">None yet.</li> : null}
              {data.messages.map((msg) => (
                <li key={msg.id} className="rounded-2xl border border-white/6 bg-white/[0.02] p-3">
                  <p className="font-medium text-white/85">{msg.subject}</p>
                  <p className="text-xs text-white/45">{msg.name} · {msg.email} · {msg.createdAt}</p>
                  <p className="mt-1 text-xs leading-5 text-white/55">{msg.message}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
            <h3 className="font-semibold text-white">Newsletter subscribers ({data.subscribers.length})</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/60">
              {data.subscribers.length === 0 ? <li className="text-white/40">None yet.</li> : null}
              {data.subscribers.map((sub) => (
                <li key={sub.id} className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-3 py-2">
                  <span>{sub.email}</span>
                  <span className="text-xs text-white/35">{sub.createdAt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {tab === "Audit Logs" ? (
        <section className="mt-8">
          <div className="rounded-[1.75rem] border border-white/8 bg-[#0d0d0d] p-5">
            <h3 className="font-semibold text-white">Audit trail ({data.logs.length})</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.logs.length === 0 ? <li className="text-white/40">No actions recorded yet.</li> : null}
              {data.logs.map((log) => (
                <li key={log.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-2.5 text-white/60">
                  <span className="rounded-full border border-[#d6c3a1]/25 bg-[#d6c3a1]/10 px-2.5 py-0.5 text-xs font-semibold uppercase text-[#d6c3a1]">{log.action}</span>
                  <span className="text-white/80">{log.detail}</span>
                  <span className="ml-auto text-xs text-white/35">{log.adminEmail} · {log.createdAt}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}