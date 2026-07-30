import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Portal Login",
  description: "Secure administrative access for Black Tax governance.",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

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
              <h1 className="text-xl font-semibold tracking-[-0.02em] text-white">Admin Portal</h1>
              <p className="mt-1 text-sm text-white/50">Governance, approvals & publishing</p>
            </div>
          </div>

          <AdminLoginForm />

          <div className="mt-8 space-y-3 border-t border-white/8 pt-6">
            <div className="flex items-start gap-3 text-xs leading-6 text-white/45">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#d6c3a1]" />
              <span>Role-based access with full audit logging. Every approval, decline and publish action is recorded.</span>
            </div>
            <div className="flex items-start gap-3 text-xs leading-6 text-white/45">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#d6c3a1]" />
              <span>Sessions are signed and expire after 12 hours. Owner, Admin and Finance accounts each see role-appropriate tools.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}