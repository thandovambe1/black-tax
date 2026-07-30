"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Loader2, MessageCircleHeart, Quote, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type WallEntry = {
  id: number;
  displayName: string;
  location: string;
  messageType: string;
  message: string;
  amount: number | null;
  createdAt: string;
};

const TYPE_META: Record<string, { label: string; icon: typeof Heart; accent: string }> = {
  support: { label: "Support", icon: Heart, accent: "text-[#d6c3a1]" },
  tribute: { label: "Tribute", icon: Quote, accent: "text-[#c9a86a]" },
  motivation: { label: "Motivation", icon: Sparkles, accent: "text-[#e6d3a6]" },
};

function timeAgo(iso: string) {
  const parsed = new Date(iso).getTime();
  if (!Number.isFinite(parsed)) return "recently";
  const diff = Date.now() - parsed;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(amount);
}

function WallCard({ entry }: { entry: WallEntry }) {
  const meta = TYPE_META[entry.messageType] ?? TYPE_META.support;
  const Icon = meta.icon;
  const initials = entry.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-[1.6rem] border border-white/8 bg-[#0d0d0d] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#d6c3a1]/25 bg-[#d6c3a1]/10 text-sm font-semibold text-[#d6c3a1]">
          {initials || "BT"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-white">{entry.displayName}</p>
            <span className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${meta.accent}`}>
              <Icon className="h-3 w-3" /> {meta.label}
            </span>
          </div>
          <p className="text-xs text-white/40">
            {entry.location ? `${entry.location} · ` : ""}
            {timeAgo(entry.createdAt)}
          </p>
        </div>
        {entry.amount != null ? (
          <span className="shrink-0 rounded-full border border-[#d6c3a1]/30 bg-[#d6c3a1]/10 px-3 py-1 text-xs font-semibold text-[#d6c3a1]">
            {formatAmount(entry.amount)}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-7 text-white/72">{entry.message}</p>
    </motion.article>
  );
}

const messageTypes = [
  ["support", "Message of support"],
  ["tribute", "Tribute"],
  ["motivation", "Motivation"],
] as const;

const inputClass =
  "mt-1.5 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50 focus:ring-4 focus:ring-[#d6c3a1]/10";

export function DonorWall() {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    location: "",
    messageType: "support",
    message: "",
    amount: "",
    showAmount: false,
  });

  const load = async () => {
    const response = await fetch("/api/donor-wall", { cache: "no-store" });
    const data = (await response.json()) as { messages: WallEntry[] };
    setEntries(data.messages ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const amountValue = form.amount.trim() ? Number(form.amount) : undefined;
    const response = await fetch("/api/donor-wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName,
        location: form.location || undefined,
        messageType: form.messageType,
        message: form.message,
        amount: amountValue,
        showAmount: form.showAmount,
      }),
    });
    const data = (await response.json()) as { ok: boolean; message: string; entry?: WallEntry };
    setPending(false);
    setFeedback(data.message);
    if (data.ok && data.entry) {
      setEntries((prev) => [data.entry as WallEntry, ...prev]);
      setForm({ displayName: "", location: "", messageType: "support", message: "", amount: "", showAmount: false });
    }
  };

  const remaining = useMemo(() => 500 - form.message.length, [form.message]);

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      {/* Submission form */}
      <form onSubmit={submit} className="h-fit rounded-[2rem] border border-white/8 bg-[#0d0d0d] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 text-[#d6c3a1]">
          <MessageCircleHeart className="h-5 w-5" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em]">Add your message</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-white/55">
          Leave a message of support, a tribute, or a motivation for the community. You can optionally show the amount you gave.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="block text-xs font-medium text-white/60">
            Display name
            <input
              required
              maxLength={120}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Full Name or 'Anonymous'"
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-white/60">
            Location (optional)
            <input
              maxLength={120}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City / Province"
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-medium text-white/60">
            Message type
            <select
              value={form.messageType}
              onChange={(e) => setForm({ ...form, messageType: e.target.value })}
              className={inputClass}
            >
              {messageTypes.map(([value, label]) => (
                <option key={value} value={value} className="bg-[#0d0d0d]">
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-white/60">
            Your message
            <textarea
              required
              rows={4}
              maxLength={500}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Share your words of support, a tribute, or what motivates your giving…"
              className={inputClass}
            />
            <span className="mt-1 block text-right text-[0.65rem] text-white/35">{remaining} characters left</span>
          </label>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <label className="block text-xs font-medium text-white/60">
              Donation amount (optional)
              <input
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="R amount"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 pb-3 text-xs text-white/60">
              <input
                type="checkbox"
                className="accent-[#d6c3a1]"
                checked={form.showAmount}
                onChange={(e) => setForm({ ...form, showAmount: e.target.checked })}
              />
              Show amount
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Post to the Donor Wall
          </button>
          {feedback ? <p className="text-xs leading-6 text-white/55">{feedback}</p> : null}
        </div>
      </form>

      {/* Scrolling chronological feed */}
      <div className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#0c0c0c,#080808)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6c3a1]">Live donor wall</p>
          <span className="flex items-center gap-2 text-xs text-white/45">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#d6c3a1] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#d6c3a1]" />
            </span>
            {entries.length} message{entries.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="mt-6 flex h-64 items-center justify-center text-sm text-white/40">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading messages…
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-6 flex h-64 flex-col items-center justify-center rounded-[1.6rem] border border-dashed border-white/12 bg-white/[0.02] px-6 text-center">
            <MessageCircleHeart className="h-10 w-10 text-[#d6c3a1]/70" />
            <p className="mt-4 text-sm font-medium text-white/80">No messages have been posted yet.</p>
            <p className="mt-1 text-sm text-white/45">Be the first to leave a message of support for the community.</p>
          </div>
        ) : (
          <div className="donor-wall-scroll mt-5 flex max-h-[34rem] flex-col gap-4 overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <WallCard key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}