import { randomBytes } from "crypto";
import { z } from "zod";
import { db } from "@/db";
import { financialAdjustments } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { recordLedgerEntry } from "@/lib/ledger";
import { logFinancialAction } from "@/lib/financial-reporting/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  originalTransactionType: z.enum(["donation", "debit_collection", "payout", "general"]),
  originalTransactionId: z.number().int().positive().optional(),
  reason: z.string().min(10).max(1000),
  amountRand: z.number().positive(),
  adjustmentType: z.enum(["credit", "debit"]),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  if (session.role !== "owner" && session.role !== "finance") {
    return Response.json({ ok: false, message: "Only finance and owner roles can create financial adjustments." }, { status: 403 });
  }

  try {
    const body = schema.parse(await request.json());
    const adjustmentReference = `ADJ-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const amountCents = Math.round(body.amountRand * 100);

    const [adjustment] = await db
      .insert(financialAdjustments)
      .values({
        adjustmentReference,
        originalTransactionType: body.originalTransactionType,
        originalTransactionId: body.originalTransactionId ?? null,
        reason: body.reason.trim(),
        amount: amountCents,
        adjustmentType: body.adjustmentType,
        adminEmail: session.email,
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      })
      .returning();

    // Append to immutable financial ledger
    const entryType = body.adjustmentType === "credit" ? "ADJUSTMENT_CREDIT" : "ADJUSTMENT_DEBIT";
    await recordLedgerEntry({
      entryType,
      amountCents,
      relatedEntity: "adjustment",
      relatedEntityId: adjustment.id,
      description: `Manual adjustment [${adjustmentReference}]: ${body.reason}`,
      recordedBy: session.email,
    });

    await logFinancialAction({
      adminEmail: session.email,
      action: "financial adjustment created",
      entity: "financial_adjustment",
      entityId: adjustment.id,
      transactionReference: adjustmentReference,
      newState: {
        adjustmentReference,
        amountCents,
        adjustmentType: body.adjustmentType,
        reason: body.reason,
      },
      detail: `Adjustment ${adjustmentReference} of R${body.amountRand.toFixed(2)} (${body.adjustmentType}) created by ${session.email}: ${body.reason}`,
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    });

    return Response.json({
      ok: true,
      message: `Adjustment ${adjustmentReference} successfully recorded in ledger.`,
      adjustment,
    });
  } catch (err) {
    const errorMsg =
      err instanceof z.ZodError
        ? err.issues?.[0]?.message ?? err.message
        : "Failed to create financial adjustment.";
    return Response.json({ ok: false, message: errorMsg }, { status: 400 });
  }
}
