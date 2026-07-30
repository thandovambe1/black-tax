"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { message: string };
    setPending(false);
    setMessage(data.message);
    if (response.ok) setEmail("");
  };

  return (
    <form onSubmit={onSubmit} className="mt-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex overflow-hidden rounded-full border border-white/12 bg-white/[0.04] shadow-inner focus-within:border-[#d6c3a1]/50">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          className="w-full bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe to newsletter"
          className="flex items-center gap-2 bg-[#f3efe7] px-5 text-sm font-semibold text-black transition hover:bg-white disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Subscribe</span>
        </button>
      </div>
      {message ? <p className="mt-3 text-xs leading-6 text-white/55">{message}</p> : null}
    </form>
  );
}