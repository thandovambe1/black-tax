"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = (await response.json()) as { ok: boolean; message?: string };
    setPending(false);
    if (response.ok && data.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(data.message ?? "Login failed.");
    }
  };

  const inputClass =
    "mt-2 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white shadow-inner outline-none transition placeholder:text-white/30 focus:border-[#d6c3a1]/50 focus:ring-4 focus:ring-[#d6c3a1]/10";

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      <label className="block text-sm font-medium text-white/75">
        Admin email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="owner@blacktax.org.za"
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
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#f3efe7] px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        Sign in to Admin Portal
      </button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}