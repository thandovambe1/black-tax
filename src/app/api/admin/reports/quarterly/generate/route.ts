import { z } from "zod";
import { getAdminSession } from "@/lib/admin-auth";
import { generateQuarterlyReport } from "@/lib/financial-reporting/quarterly";

export const dynamic = "force-dynamic";

const schema = z.object({
  year: z.number().int().min(2020).max(2100),
  quarterNumber: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  revisionReason: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  if (session.role !== "owner" && session.role !== "finance") {
    return Response.json({ ok: false, message: "Only finance and owner roles can generate quarterly reports." }, { status: 403 });
  }

  try {
    const body = schema.parse(await request.json());
    const report = await generateQuarterlyReport(
      body.year,
      body.quarterNumber,
      session.email,
      body.revisionReason,
    );

    return Response.json({
      ok: true,
      message: `Quarterly report for ${body.year}-Q${body.quarterNumber} generated successfully.`,
      report,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Failed to generate quarterly report.",
      },
      { status: 400 },
    );
  }
}
