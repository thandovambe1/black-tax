"use client";

import { Heart, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

const PRESETS = [50, 100, 250, 500, 1000];

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50 focus:ring-4 focus:ring-[#d6c3a1]/10";

export function DonateForm() {
  const [amount, setAmount] = useState<number | "">(100);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    donorName: "",
    donorEmail: "",
    isRecurring: false,
    addMessage: false,
    wallMessage: "",
    wallMessageType: "support",
    wallLocation: "",
    wallShowAmount: false,
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = typeof amount === "number" ? amount : Number(amount);
    if (!value || value < 10) {
      setMessage("Please enter an amount of at least R10.");
      return;
    }
    setPending(true);
    setMessage(null);

    const response = await fetch("/api/payments/donate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: value,
        donorName: form.donorName,
        donorEmail: form.donorEmail,
        isRecurring: form.isRecurring,
        wallMessage: form.addMessage && form.wallMessage ? form.wallMessage : undefined,
        wallMessageType: form.addMessage ? form.wallMessageType : undefined,
        wallLocation: form.addMessage && form.wallLocation ? form.wallLocation : undefined,
        wallShowAmount: form.addMessage ? form.wallShowAmount : false,
      }),
    });

    const data = (await response.json()) as { ok: boolean; message?: string; redirectUrl?: string };

    if (data.ok && data.redirectUrl) {
      window.location.href = data.redirectUrl; // hand off to secure Yoco checkout
      return;
    }

    setPending(false);
    setMessage(data.message ?? "We could not start your donation. Please try again.");
  };

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 text-[#d6c3a1]">
        <Heart className="h-5 w-5" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em]">Donate securely</p>
      </div>

      <div>
        <p className="text-xs font-medium text-white/60">Choose an amount (ZAR)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                amount === preset
                  ? "bg-[#f3efe7] text-black"
                  : "border border-white/12 bg-white/[0.03] text-white/70 hover:text-white"
              }`}
            >
              R{preset}
            </button>
          ))}
          <input
            type="number"
            min={10}
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="Custom"
            className="w-28 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-sm text-white outline-none focus:border-[#d6c3a1]/50"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-white/60">
          Full name
          <input required value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} placeholder="Full Name" className={inputClass} />
        </label>
        <label className="block text-xs font-medium text-white/60">
          Email address
          <input required type="email" value={form.donorEmail} onChange={(e) => setForm({ ...form, donorEmail: e.target.value })} placeholder="Email Address" className={inputClass} />
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
        <input type="checkbox" className="accent-[#d6c3a1]" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} />
        Make this a monthly recurring donation
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
        <input type="checkbox" className="accent-[#d6c3a1]" checked={form.addMessage} onChange={(e) => setForm({ ...form, addMessage: e.target.checked })} />
        Add a message to the Donor Wall
      </label>

      {form.addMessage ? (
        <div className="grid gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-white/60">
              Message type
              <select value={form.wallMessageType} onChange={(e) => setForm({ ...form, wallMessageType: e.target.value })} className={inputClass}>
                <option value="support" className="bg-[#0d0d0d]">Message of support</option>
                <option value="tribute" className="bg-[#0d0d0d]">Tribute</option>
                <option value="motivation" className="bg-[#0d0d0d]">Motivation</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-white/60">
              Location (optional)
              <input value={form.wallLocation} onChange={(e) => setForm({ ...form, wallLocation: e.target.value })} placeholder="City / Province" className={inputClass} />
            </label>
          </div>
          <label className="block text-xs font-medium text-white/60">
            Your message
            <textarea rows={3} maxLength={500} value={form.wallMessage} onChange={(e) => setForm({ ...form, wallMessage: e.target.value })} placeholder="Share a message of support, a tribute, or your motivation…" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" className="accent-[#d6c3a1]" checked={form.wallShowAmount} onChange={(e) => setForm({ ...form, wallShowAmount: e.target.checked })} />
            Show my donation amount on the wall
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
        Donate {typeof amount === "number" && amount > 0 ? `R${amount}` : "now"} securely
      </button>
      {message ? <p className="text-sm leading-6 text-white/60">{message}</p> : null}
      <p className="flex items-center gap-2 text-xs text-white/40">
        <ShieldCheck className="h-3.5 w-3.5 text-[#d6c3a1]" />
        Card payments are processed securely by Yoco. Black Tax never sees your card details.
      </p>
    </form>
  );
}
