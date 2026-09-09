import { getAdminSession } from "@/lib/admin-auth";
import { exportFinancialTransactionsCsv } from "@/lib/financial-reporting/export";
import { logFinancialAction } from "@/lib/financial-reporting/audit";
import type { SouthAfricanProvince, TransactionStatus } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return new Response("Unauthorised", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const province = (searchParams.get("province") as SouthAfricanProvince) || undefined;
  const status = (searchParams.get("status") as TransactionStatus) || undefined;
  const paymentMethod = searchParams.get("paymentMethod") || undefined;
  const recurringParam = searchParams.get("isRecurring");
  const isRecurring = recurringParam ? recurringParam === "true" : undefined;

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const startDate = startDateParam ? new Date(startDateParam) : undefined;
  const endDate = endDateParam ? new Date(endDateParam) : undefined;

  const csvContent = await exportFinancialTransactionsCsv({
    startDate,
    endDate,
    province,
    status,
    paymentMethod,
    isRecurring,
  });

  const filename = `blacktax-financial-ledger-${new Date().toISOString().slice(0, 10)}.csv`;

  await logFinancialAction({
    adminEmail: session.email,
    action: "financial data exported",
    entity: "financial_export",
    detail: `Financial transaction export generated with filters: ${JSON.stringify({ province, status, isRecurring })}`,
  });

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
