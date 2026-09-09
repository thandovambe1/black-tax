"use client";

import { Building2, CreditCard, Heart, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { SA_PROVINCES, type SouthAfricanProvince } from "@/lib/payments/types";
import { SOUTH_AFRICAN_BANKS } from "@/lib/payments/bank-registry";

const PRESETS = [20, 50, 100, 250, 500, 1000];

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50 focus:ring-4 focus:ring-[#d6c3a1]/10";

type PaymentMethodTab = "card" | "debicheck";

export function DonateForm() {
  const [methodTab, setMethodTab] = useState<PaymentMethodTab>("card");
  const [amount, setAmount] = useState<number | "">(100);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [authInstructions, setAuthInstructions] = useState<string | null>(null);

  const [form, setForm] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    province: "Gauteng" as SouthAfricanProvince,
    isRecurring: false,
    isAnonymous: false,
    // Debit order specific
    bankName: SOUTH_AFRICAN_BANKS[0].bankName,
    accountNumber: "",
    accountType: "cheque" as "cheque" | "savings" | "transmission",
    branchCode: SOUTH_AFRICAN_BANKS[0].universalBranchCode,
    collectionDay: "1st" as "1st" | "7th" | "15th" | "20th" | "25th" | "Month End",
    // Donor wall optional message
    addMessage: false,
    wallMessage: "",
    wallMessageType: "support" as "support" | "tribute" | "motivation",
    wallLocation: "",
    wallShowAmount: false,
    consentTerms: false,
  });

  const handleBankChange = (name: string) => {
    const selected = SOUTH_AFRICAN_BANKS.find((b) => b.bankName === name);
    setForm((prev) => ({
      ...prev,
      bankName: name,
      branchCode: selected?.universalBranchCode ?? prev.branchCode,
    }));
  };

  const submitCardDonation = async () => {
    const value = typeof amount === "number" ? amount : Number(amount);
    if (!value || value < 10) {
      setMessage("Please enter a donation amount of at least R10.00.");
      return;
    }

    if (!form.donorName.trim() || !form.donorEmail.trim()) {
      setMessage("Please provide your name and a valid email address.");
      return;
    }

    setPending(true);
    setMessage(null);
    setAuthInstructions(null);

    try {
      const response = await fetch("/api/payments/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          donorName: form.donorName,
          donorEmail: form.donorEmail,
          donorPhone: form.donorPhone || undefined,
          province: form.province,
          isRecurring: form.isRecurring,
          isAnonymous: form.isAnonymous,
          wallMessage: form.addMessage && form.wallMessage ? form.wallMessage : undefined,
          wallMessageType: form.addMessage ? form.wallMessageType : undefined,
          wallLocation: form.addMessage && form.wallLocation ? form.wallLocation : undefined,
          wallShowAmount: form.addMessage ? form.wallShowAmount : false,
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message?: string;
        redirectUrl?: string;
        configured?: boolean;
      };

      if (data.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setPending(false);
      setMessage(data.message ?? "We could not start your donation. Please try again.");
    } catch {
      setPending(false);
      setMessage("Network error communicating with the payment system. Please try again.");
    }
  };

  const submitDebitOrderMandate = async () => {
    const value = typeof amount === "number" ? amount : Number(amount);
    if (!value || value < 10) {
      setMessage("Please enter a monthly contribution amount of at least R10.00.");
      return;
    }

    if (!form.donorName.trim() || !form.donorEmail.trim() || !form.donorPhone.trim()) {
      setMessage("Please provide your full name, email, and mobile number for DebiCheck authentication.");
      return;
    }

    if (!form.accountNumber.trim()) {
      setMessage("Please provide your bank account number.");
      return;
    }

    if (!form.consentTerms) {
      setMessage("Please consent to the recurring debit order authorization terms.");
      return;
    }

    setPending(true);
    setMessage(null);
    setAuthInstructions(null);

    try {
      const response = await fetch("/api/debit-orders/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorName: form.donorName,
          donorEmail: form.donorEmail,
          donorPhone: form.donorPhone,
          province: form.province,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountType: form.accountType,
          branchCode: form.branchCode,
          amount: value,
          collectionDay: form.collectionDay,
          mandateType: "debicheck",
          authChannel: "App",
        }),
      });

      const data = (await response.json()) as {
        ok: boolean;
        message: string;
        authInstructions?: string;
        mandateReference?: string;
      };

      setPending(false);
      if (data.ok) {
        setMessage(data.message);
        setAuthInstructions(
          data.authInstructions ||
            `DebiCheck mandate reference: ${data.mandateReference}. Please approve the prompt in your ${form.bankName} app.`,
        );
        setForm((prev) => ({ ...prev, accountNumber: "" }));
      } else {
        setMessage(data.message || "Debit mandate registration failed.");
      }
    } catch {
      setPending(false);
      setMessage("Failed to register debit mandate. Please check your details and try again.");
    }
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (methodTab === "card") {
      submitCardDonation();
    } else {
      submitDebitOrderMandate();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-4 rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#d6c3a1]">
          <Heart className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">
            {methodTab === "card" ? "Donate securely" : "DebiCheck Debit Order"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/60">
          <Lock className="h-3 w-3 text-[#d6c3a1]" /> 256-bit TLS Encrypted
        </span>
      </div>

      {/* Payment rail selector */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-white/[0.02] p-1.5">
        <button
          type="button"
          onClick={() => {
            setMethodTab("card");
            setMessage(null);
            setAuthInstructions(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
            methodTab === "card"
              ? "bg-[#f3efe7] text-black shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <CreditCard className="h-4 w-4" /> Card / Instant (Yoco)
        </button>
        <button
          type="button"
          onClick={() => {
            setMethodTab("debicheck");
            setMessage(null);
            setAuthInstructions(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition ${
            methodTab === "debicheck"
              ? "bg-[#f3efe7] text-black shadow-md"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Building2 className="h-4 w-4" /> DebiCheck Bank Debit
        </button>
      </div>

      {/* Amount Selector */}
      <div>
        <p className="text-xs font-medium text-white/60">
          {methodTab === "card" ? "Contribution amount (ZAR)" : "Monthly contribution amount (ZAR)"}
        </p>
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

      {/* Donor Information */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-white/60">
          Full name
          <input
            required
            value={form.donorName}
            onChange={(e) => setForm({ ...form, donorName: e.target.value })}
            placeholder="Full Name"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-white/60">
          Email address
          <input
            required
            type="email"
            value={form.donorEmail}
            onChange={(e) => setForm({ ...form, donorEmail: e.target.value })}
            placeholder="Email Address"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-white/60">
          Mobile number {methodTab === "debicheck" ? "(Required for DebiCheck)" : "(Optional)"}
          <input
            required={methodTab === "debicheck"}
            type="tel"
            value={form.donorPhone}
            onChange={(e) => setForm({ ...form, donorPhone: e.target.value })}
            placeholder="082 123 4567"
            className={inputClass}
          />
        </label>
        <label className="block text-xs font-medium text-white/60">
          Province of impact
          <select
            value={form.province}
            onChange={(e) => setForm({ ...form, province: e.target.value as SouthAfricanProvince })}
            className={inputClass}
          >
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p} className="bg-[#0d0d0d]">
                {p}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Card specific options */}
      {methodTab === "card" ? (
        <div className="space-y-3">
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
            <input
              type="checkbox"
              className="accent-[#d6c3a1]"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
            />
            Make this a monthly recurring card contribution
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
            <input
              type="checkbox"
              className="accent-[#d6c3a1]"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
            />
            <span>
              Anonymous contribution <span className="text-xs text-white/45">(Display publicly as &ldquo;Anonymous Donor&rdquo;)</span>
            </span>
          </label>
        </div>
      ) : null}

      {/* DebiCheck specific banking fields */}
      {methodTab === "debicheck" ? (
        <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#d6c3a1]">
            South African Bank Account Details
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-white/60">
              Bank name
              <select
                value={form.bankName}
                onChange={(e) => handleBankChange(e.target.value)}
                className={inputClass}
              >
                {SOUTH_AFRICAN_BANKS.map((b) => (
                  <option key={b.bankCode} value={b.bankName} className="bg-[#0d0d0d]">
                    {b.bankName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-white/60">
              Account type
              <select
                value={form.accountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    accountType: e.target.value as "cheque" | "savings" | "transmission",
                  })
                }
                className={inputClass}
              >
                <option value="cheque" className="bg-[#0d0d0d]">Cheque / Current Account</option>
                <option value="savings" className="bg-[#0d0d0d]">Savings Account</option>
                <option value="transmission" className="bg-[#0d0d0d]">Transmission Account</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-white/60">
              Account number
              <input
                required
                type="password"
                autoComplete="off"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="Account number"
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-medium text-white/60">
              Monthly debit collection day
              <select
                value={form.collectionDay}
                onChange={(e) =>
                  setForm({
                    ...form,
                    collectionDay: e.target.value as typeof form.collectionDay,
                  })
                }
                className={inputClass}
              >
                {["1st", "7th", "15th", "20th", "25th", "Month End"].map((d) => (
                  <option key={d} value={d} className="bg-[#0d0d0d]">
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-[#d6c3a1]/20 bg-[#d6c3a1]/5 p-3.5 text-xs leading-5 text-white/70">
            <input
              type="checkbox"
              className="mt-1 accent-[#d6c3a1]"
              checked={form.consentTerms}
              onChange={(e) => setForm({ ...form, consentTerms: e.target.checked })}
            />
            <span>
              I authorise Black Tax NPO to register an authenticated DebiCheck debit order mandate against my bank
              account for the specified monthly amount. I understand authentication will be verified directly via my bank
              app or USSD, and I may cancel at any time.
            </span>
          </label>
        </div>
      ) : null}

      {/* Optional Donor Wall message */}
      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/70">
        <input
          type="checkbox"
          className="accent-[#d6c3a1]"
          checked={form.addMessage}
          onChange={(e) => setForm({ ...form, addMessage: e.target.checked })}
        />
        <span>Add a message of support to the Donor Wall</span>
      </label>

      {form.addMessage ? (
        <div className="grid gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-medium text-white/60">
              Message type
              <select
                value={form.wallMessageType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    wallMessageType: e.target.value as "support" | "tribute" | "motivation",
                  })
                }
                className={inputClass}
              >
                <option value="support" className="bg-[#0d0d0d]">Message of support</option>
                <option value="tribute" className="bg-[#0d0d0d]">Tribute</option>
                <option value="motivation" className="bg-[#0d0d0d]">Motivation</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-white/60">
              City / Township (optional)
              <input
                value={form.wallLocation}
                onChange={(e) => setForm({ ...form, wallLocation: e.target.value })}
                placeholder="e.g., Soweto, Polokwane"
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-xs font-medium text-white/60">
            Your message
            <textarea
              rows={3}
              maxLength={500}
              value={form.wallMessage}
              onChange={(e) => setForm({ ...form, wallMessage: e.target.value })}
              placeholder="Share a word of encouragement or why you contribute…"
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-white/60">
            <input
              type="checkbox"
              className="accent-[#d6c3a1]"
              checked={form.wallShowAmount}
              onChange={(e) => setForm({ ...form, wallShowAmount: e.target.checked })}
            />
            Show my contribution amount on the donor wall
          </label>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {methodTab === "card"
          ? `Donate ${typeof amount === "number" && amount > 0 ? `R${amount}` : ""} securely`
          : `Authorise DebiCheck (${typeof amount === "number" && amount > 0 ? `R${amount}` : "R10"}/mo)`}
      </button>

      {message ? <p className="text-sm leading-6 text-white/70">{message}</p> : null}

      {authInstructions ? (
        <div className="rounded-2xl border border-[#d6c3a1]/30 bg-[#d6c3a1]/10 p-4 text-xs leading-6 text-[#f3efe7]">
          <p className="font-semibold uppercase tracking-wider text-[#d6c3a1]">Bank Action Required</p>
          <p className="mt-1">{authInstructions}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-white/40">
        <ShieldCheck className="h-3.5 w-3.5 text-[#d6c3a1]" />
        <span>
          {methodTab === "card"
            ? "Card payments are processed securely by Yoco. Black Tax never sees or stores card numbers."
            : "Debit orders are verified through South African DebiCheck banking rails. Authentication is handled by your bank."}
        </span>
      </div>
    </form>
  );
}
