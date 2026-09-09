import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import type { SouthAfricanProvince, TransactionStatus } from "../payments/types";

export interface ExportFilterOptions {
  startDate?: Date;
  endDate?: Date;
  province?: SouthAfricanProvince;
  status?: TransactionStatus;
  paymentMethod?: string;
  isRecurring?: boolean;
}

function escapeCsv(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportFinancialTransactionsCsv(filters: ExportFilterOptions): Promise<string> {
  const conditions = [];

  if (filters.startDate) conditions.push(gte(donations.createdAt, filters.startDate));
  if (filters.endDate) conditions.push(lte(donations.createdAt, filters.endDate));
  if (filters.province) conditions.push(eq(donations.province, filters.province));
  if (filters.status) conditions.push(eq(donations.status, filters.status));
  if (filters.paymentMethod) conditions.push(eq(donations.paymentMethod, filters.paymentMethod));
  if (filters.isRecurring !== undefined) conditions.push(eq(donations.isRecurring, filters.isRecurring));

  const rows = await db
    .select()
    .from(donations)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(donations.id))
    .limit(2000);

  const headers = [
    "TransactionID",
    "Reference",
    "DateUTC",
    "DonorName",
    "DonorEmail",
    "GrossAmountZAR",
    "FeeAmountZAR",
    "NetAmountZAR",
    "Currency",
    "Province",
    "PaymentMethod",
    "Provider",
    "Status",
    "Recurring",
    "ReconciliationStatus",
  ].join(",");

  const lines = rows.map((r) => {
    const grossRand = (r.amount / 100).toFixed(2);
    const feeRand = (r.feeAmount / 100).toFixed(2);
    const netRand = ((r.amount - r.feeAmount) / 100).toFixed(2);
    const displayName = r.isAnonymous ? "Anonymous Donor" : r.donorName;
    const displayEmail = r.isAnonymous ? "masked@blacktax.org.za" : r.donorEmail;

    return [
      r.id,
      escapeCsv(r.reference),
      escapeCsv(new Date(r.createdAt).toISOString()),
      escapeCsv(displayName),
      escapeCsv(displayEmail),
      grossRand,
      feeRand,
      netRand,
      r.currency,
      escapeCsv(r.province),
      escapeCsv(r.paymentMethod),
      escapeCsv(r.provider),
      r.status,
      r.isRecurring ? "YES" : "NO",
      r.reconciliationStatus,
    ].join(",");
  });

  return [headers, ...lines].join("\n");
}
