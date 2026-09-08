"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] route error:", error);
  }, [error]);

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#060606] px-4 py-16 text-[#f3efe7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,195,161,0.10),_transparent_38%),linear-gradient(180deg,_#050505_0%,#0a0a0a_50%,#050505_100%)]" />
      <div className="relative z-10 w-full max-w-md rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d6c3a1]">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">We hit an unexpected error</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Our team has been notified. Please try again in a moment.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-[#f3efe7] px-5 py-3 text-sm font-semibold text-black transition hover:bg-white"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.07]"
          >
            Back to home
          </a>
        </div>
      </div>
    </main>
  );
}
