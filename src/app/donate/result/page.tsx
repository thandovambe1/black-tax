import type { Metadata } from "next";
import { DonateResult } from "@/components/donate-result";

export const metadata: Metadata = {
  title: "Donation Result",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function DonateResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string }>;
}) {
  const params = await searchParams;
  const reference = params.ref ?? "";
  const status = params.status ?? "pending";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#060606] px-4 py-16 text-[#f3efe7]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,195,161,0.10),_transparent_38%),linear-gradient(180deg,_#050505_0%,#0a0a0a_50%,#050505_100%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative z-10">
        {reference ? (
          <DonateResult reference={reference} initialStatus={status} />
        ) : (
          <div className="w-full max-w-md rounded-[2.25rem] border border-white/10 bg-[#0d0d0d] p-8 text-center">
            <h1 className="text-2xl font-semibold text-white">No donation reference found</h1>
            <p className="mt-3 text-sm text-white/55">Please return to the donation page to try again.</p>
          </div>
        )}
      </div>
    </main>
  );
}
