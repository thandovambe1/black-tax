import { randomBytes } from "crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assistanceRequests, auditLogs, payouts } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { submitFnbPayout } from "@/lib/payments/fnb";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  beneficiaryName: z.string().min(2).max(180),
  beneficiaryAccount: z.string().min(4).max(40),
  branchCode: z.string().min(4).max(20),
  amount: z.number().int().min(1), // rand
  purpose: z.string().max(200).optional(),
  assistanceRequestId: z.number().int().positive().optional(),
});

function makeReference() {
  return `PO-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

function financeGuard(role: string) {
  return role === "owner" || role === "finance";
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });

  const rows = await db.select().from(payouts).orderBy(desc(payouts.id)).limit(200);
  return Response.json({ ok: true, payouts: rows });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  if (!financeGuard(session.role)) {
    return Response.json({ ok: false, message: "Only finance and owner accounts can create payouts." }, { status: 403 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const reference = makeReference();

    const [payout] = await db
      .insert(payouts)
      .values({
        reference,
        provider: "fnb",
        beneficiaryName: body.beneficiaryName.trim(),
        beneficiaryAccount: body.beneficiaryAccount.trim(),
        branchCode: body.branchCode.trim(),
        amount: Math.round(body.amount * 100),
        purpose: body.purpose?.trim() ?? "",
        assistanceRequestId: body.assistanceRequestId ?? null,
        status: "pending",
        createdBy: session.email,
      })
      .returning();

    if (body.assistanceRequestId) {
      await db
        .update(assistanceRequests)
        .set({ paymentStatus: "processing" })
        .where(eq(assistanceRequests.id, body.assistanceRequestId));
    }

    await db.insert(auditLogs).values({
      adminEmail: session.email,
      action: "payout created",
      entity: "payout",
      entityId: payout.id,
      detail: `Payout ${reference} to ${payout.beneficiaryName} (${(payout.amount / 100).toFixed(2)} ZAR)`,
    });

    return Response.json({ ok: true, message: `Payout ${reference} created.`, payout });
  } catch {
    return Response.json({ ok: false, message: "Could not create payout. Check the details and try again." }, { status: 400 });
  }
}

const releaseSchema = z.object({ id: z.number().int().positive() });

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  if (!financeGuard(session.role)) {
    return Response.json({ ok: false, message: "Only finance and owner accounts can release payouts." }, { status: 403 });
  }

  try {
    const { id } = releaseSchema.parse(await request.json());
    const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
    if (!payout) return Response.json({ ok: false, message: "Payout not found." }, { status: 404 });
    if (payout.status === "released") {
      return Response.json({ ok: false, message: "This payout has already been released." }, { status: 400 });
    }

    const result = await submitFnbPayout({
      reference: payout.reference,
      beneficiaryName: payout.beneficiaryName,
      beneficiaryAccount: payout.beneficiaryAccount,
      branchCode: payout.branchCode,
      amount: payout.amount,
      purpose: payout.purpose,
    });

    if (!result.ok) {
      return Response.json({ ok: false, message: result.error }, { status: 502 });
    }

    await db
      .update(payouts)
      .set({
        status: "released",
        batchReference: result.providerReference,
        releasedBy: session.email,
        releasedAt: new Date(),
      })
      .where(eq(payouts.id, id));

    if (payout.assistanceRequestId) {
      await db
        .update(assistanceRequests)
        .set({ paymentStatus: "released" })
        .where(eq(assistanceRequests.id, payout.assistanceRequestId));
    }

    await db.insert(auditLogs).values({
      adminEmail: session.email,
      action: "payout released",
      entity: "payout",
      entityId: id,
      detail: `Payout ${payout.reference} released via FNB (${result.mode}) by ${session.role}`,
    });

    return Response.json({ ok: true, message: result.message });
  } catch {
    return Response.json({ ok: false, message: "Could not release payout." }, { status: 400 });
  }
}
