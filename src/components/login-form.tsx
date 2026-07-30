"use client";

import { Loader2, LogIn } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setPending(false);
    setMessage(
      "Secure member authentication activates once production Supabase credentials are configured. Your dashboard — contributions, receipts, debit dates and funded projects — will be available here.",
    );
  };

  const inputClass =
    "mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50 focus:ring-4 focus:ring-[#d6c3a1]/10";

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      <label className="block text-sm font-medium text-white/75">
        Email address
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.co.za"
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium text-white/75">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      </label>
      <div className="flex items-center justify-between text-xs text-white/45">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-[#d6c3a1]" /> Remember me
        </label>
        <button type="button" className="text-[#d6c3a1] transition hover:text-white">
          Forgot password?
        </button>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Sign in securely
      </button>
      {message ? <p className="text-xs leading-6 text-white/55">{message}</p> : null}
    </form>
  );
}