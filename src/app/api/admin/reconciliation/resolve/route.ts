import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { resolveDiscrepancy } from "@/lib/reconciliation/engine";

export const dynamic = "force-dynamic";

const schema = z.object({
  discrepancyId: z.number().int().positive(),
  notes: z.string().min(5).max(1000),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await resolveDiscrepancy(body.discrepancyId, body.notes.trim(), session.email);

    return Response.json({
      ok: true,
      message: `Discrepancy #${body.discrepancyId} resolved.`,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Could not resolve discrepancy.",
      },
      { status: 400 },
    );
  }
}
