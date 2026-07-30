import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, payouts } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";
import { buildFnbBatchCsv } from "@/lib/payments/fnb";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return new Response("Unauthorised", { status: 401 });
  if (session.role !== "owner" && session.role !== "finance") {
    return new Response("Forbidden", { status: 403 });
  }

  const pending = await db.select().from(payouts).where(inArray(payouts.status, ["pending", "processing"]));

  const batchReference = `BATCH-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).toUpperCase()}`;

  const csv = buildFnbBatchCsv(
    pending.map((p) => ({
      reference: p.reference,
      beneficiaryName: p.beneficiaryName,
      beneficiaryAccount: p.beneficiaryAccount,
      branchCode: p.branchCode,
      amount: p.amount,
      purpose: p.purpose,
    })),
    batchReference,
  );

  await db.insert(auditLogs).values({
    adminEmail: session.email,
    action: "payout batch exported",
    entity: "payout",
    detail: `Exported ${pending.length} payout(s) as ${batchReference}`,
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fnb-payout-${batchReference}.csv"`,
    },
  });
}
