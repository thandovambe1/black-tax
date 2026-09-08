"use client";

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "loading" | "succeeded" | "pending" | "failed" | "cancel" | "created" | "unknown";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

export function DonateResult({ reference, initialStatus }: { reference: string; initialStatus: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [donorName, setDonorName] = useState<string>("");
  const [polls, setPolls] = useState(0);

  useEffect(() => {
    let active = true;
    const check = async () => {
      const response = await fetch(`/api/payments/status?ref=${encodeURIComponent(reference)}`, { cache: "no-store" });
      if (!response.ok) {
        if (active) setStatus(initialStatus === "cancel" ? "cancel" : "unknown");
        return;
      }
      const data = (await response.json()) as { status: string; amount: number; donorName: string };
      if (!active) return;
      setAmount(data.amount);
      setDonorName(data.donorName);
      if (data.status === "succeeded") setStatus("succeeded");
      else if (data.status === "failed") setStatus("failed");
      else if (initialStatus === "cancel") setStatus("cancel");
      else setStatus("pending");
    };
    check();
    return () => {
      active = false;
    };
  }, [reference, initialStatus, polls]);

  // Poll a few times while pending (webhook may arrive slightly after redirect).
  useEffect(() => {
    if (status !== "pending") return;
    if (polls >= 8) return;
    const timer = setTimeout(() => setPolls((count) => count + 1), 2500);
    return () => clearTimeout(timer);
  }, [status, polls]);

  const config = {
    loading: { icon: Loader2, color: "text-white/70", title: "Checking your donation…", spin: true },
    succeeded: { icon: CheckCircle2, color: "text-emerald-400", title: "Thank you for your donation!", spin: false },
    pending: { icon: Clock, color: "text-[#d6c3a1]", title: "Your payment is being confirmed…", spin: false },
    failed: { icon: XCircle, color: "text-red-400", title: "Your payment did not go through", spin: false },
    cancel: { icon: XCircle, color: "text-white/60", title: "Your donation was cancelled", spin: false },
    created: { icon: Clock, color: "text-[#d6c3a1]", title: "Your donation is awaiting payment", spin: false },
    unknown: { icon: Clock, color: "text-white/60", title: "We could not confirm this donation", spin: false },
  }[status];

  const Icon = config.icon;

  return (
    <div className="w-full max-w-md rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
      <Icon className={`mx-auto h-16 w-16 ${config.color} ${config.spin ? "animate-spin" : ""}`} />
      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-white">{config.title}</h1>
      {amount != null && status === "succeeded" ? (
        <p className="mt-3 text-lg text-white/70">
          {donorName ? `${donorName}, your ` : "Your "}gift of{" "}
          <span className="font-semibold text-[#d6c3a1]">{formatCurrency(amount)}</span> is helping carry the weight
          together.
        </p>
      ) : null}
      {status === "pending" ? (
        <p className="mt-3 text-sm leading-6 text-white/55">
          This can take a few moments. We are securely confirming your payment with the gateway.
        </p>
      ) : null}
      {status === "failed" || status === "cancel" ? (
        <p className="mt-3 text-sm leading-6 text-white/55">
          No funds were taken. You are welcome to try again whenever you are ready.
        </p>
      ) : null}

      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/35">Reference · {reference}</p>

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/#donate"
          className="inline-flex items-center justify-center rounded-full bg-[#f3efe7] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white"
        >
          {status === "succeeded" ? "Make another donation" : "Try again"}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
