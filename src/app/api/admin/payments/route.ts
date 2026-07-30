import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assistanceRequests, auditLogs } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  id: z.number().int().positive(),
  action: z.enum(["processing", "released", "unpaid"]),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  // Only owner and finance may make/release payments to service providers.
  if (session.role !== "owner" && session.role !== "finance") {
    return Response.json({ ok: false, message: "Only finance and owner accounts can manage payments." }, { status: 403 });
  }

  try {
    const { id, action } = schema.parse(await request.json());

    const target = await db.query.assistanceRequests.findFirst({ where: eq(assistanceRequests.id, id) });
    if (!target) {
      return Response.json({ ok: false, message: "Request not found." }, { status: 404 });
    }
    if (target.status !== "approved") {
      return Response.json(
        { ok: false, message: "Only approved requests can be paid to service providers." },
        { status: 400 },
      );
    }

    await db.update(assistanceRequests).set({ paymentStatus: action }).where(eq(assistanceRequests.id, id));

    await db.insert(auditLogs).values({
      adminEmail: session.email,
      action: `payment ${action}`,
      entity: "assistance",
      entityId: id,
      detail: `Payment for assistance #${id} marked ${action} by ${session.role}`,
    });

    return Response.json({ ok: true, message: `Payment marked ${action}.` });
  } catch {
    return Response.json({ ok: false, message: "Could not update payment." }, { status: 400 });
  }
}