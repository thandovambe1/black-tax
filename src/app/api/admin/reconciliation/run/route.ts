import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { runReconciliation } from "@/lib/reconciliation/engine";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const provider = typeof body?.provider === "string" ? body.provider : "all";

    const result = await runReconciliation(session.email, provider);
    return Response.json({
      ok: true,
      message: `Reconciliation executed: ${result.matchedCount} matched, ${result.mismatchCount} discrepancies.`,
      result,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Reconciliation failed to execute.",
      },
      { status: 500 },
    );
  }
}
