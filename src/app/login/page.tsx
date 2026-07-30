import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Secure member access to your Black Tax contribution dashboard.",
};

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#060606] px-4 py-16 text-[#f3efe7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,195,161,0.10),_transparent_38%),linear-gradient(180deg,_#050505_0%,#0a0a0a_50%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-white/55 transition hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-4">
            <LogoMark className="h-14 w-14" />
            <div>
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-white">Member Login</h1>
              <p className="mt-1 text-sm text-white/50">Access your contribution dashboard</p>
            </div>
          </div>

          <LoginForm />

          <div className="mt-8 space-y-3 border-t border-white/8 pt-6">
            {[
              [ShieldCheck, "Protected by enterprise-grade security and POPIA-compliant data handling."],
              [KeyRound, "Two-factor authentication available on all member accounts."],
              [Fingerprint, "Full production authentication activates once Supabase credentials are configured."],
            ].map(([Icon, copy]) => (
              <div key={copy as string} className="flex items-start gap-3 text-xs leading-6 text-white/45">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#d6c3a1]" />
                <span>{copy as string}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-white/45">
          Not a member yet?{" "}
          <Link href="/#donate" className="font-semibold text-[#d6c3a1] transition hover:text-white">
            Join from just R10 per month
          </Link>
        </p>
      </div>
    </main>
  );
}