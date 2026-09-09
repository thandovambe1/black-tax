import { db } from "@/db";
import { financialAuditLogs } from "@/db/schema";

export interface LogFinancialActionInput {
  adminEmail: string;
  action: string;
  entity: string;
  entityId?: number;
  transactionReference?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  detail: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logFinancialAction(input: LogFinancialActionInput) {
  try {
    const [entry] = await db
      .insert(financialAuditLogs)
      .values({
        adminEmail: input.adminEmail,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        transactionReference: input.transactionReference,
        previousState: input.previousState,
        newState: input.newState,
        detail: input.detail,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      })
      .returning();
    return entry;
  } catch (err) {
    console.error("[audit] failed to record financial audit log:", err);
    return null;
  }
}
