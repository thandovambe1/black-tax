import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { assistanceRequests, auditLogs, memberships } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";

const schema = z.object({
  entity: z.enum(["membership", "assistance"]),
  id: z.number().int().positive(),
  action: z.enum(["approve", "decline"]),
});

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  try {
    const { entity, id, action } = schema.parse(await request.json());
    const status = action === "approve" ? "approved" : "declined";

    if (entity === "membership") {
      await db.update(memberships).set({ status }).where(eq(memberships.id, id));
    } else {
      await db.update(assistanceRequests).set({ status }).where(eq(assistanceRequests.id, id));
    }

    await db.insert(auditLogs).values({
      adminEmail: session.email,
      action,
      entity,
      entityId: id,
      detail: `${entity} #${id} ${status} by ${session.role}`,
    });

    return Response.json({ ok: true, message: `${entity} #${id} ${status}.` });
  } catch {
    return Response.json({ ok: false, message: "Could not apply decision." }, { status: 400 });
  }
}