import { randomBytes } from "crypto";
import { z } from "zod";
import { createDebitMandate } from "@/lib/mandates";
import { SA_PROVINCES, type SouthAfricanProvince } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

const schema = z.object({
  donorName: z.string().min(2).max(180),
  donorEmail: z.string().email().max(180),
  donorPhone: z.string().min(8).max(40),
  province: z.enum(SA_PROVINCES as [SouthAfricanProvince, ...SouthAfricanProvince[]]),
  bankName: z.string().min(2).max(120),
  accountNumber: z.string().min(4).max(30), // masked or full (we mask it immediately)
  accountType: z.enum(["cheque", "savings", "transmission"]).default("cheque"),
  branchCode: z.string().min(4).max(20),
  amount: z.number().int().min(10).max(100000), // R10 to R100,000 monthly
  collectionDay: z.enum(["1st", "7th", "15th", "20th", "25th", "Month End"]).default("1st"),
  mandateType: z.enum(["debicheck", "registered_mandate", "standard_eft"]).default("debicheck"),
  authChannel: z.enum(["USSD", "App", "ATM", "Branch", "OnlineBanking"]).default("App"),
});

function maskAccountNumber(acc: string): string {
  const clean = acc.replace(/\D/g, "");
  if (clean.length <= 4) return `****${clean}`;
  return `****${clean.slice(-4)}`;
}

export async function POST(request: Request) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (err) {
    const errorMsg =
      err instanceof z.ZodError
        ? err.issues?.[0]?.message ?? err.message
        : "Invalid debit order registration data.";
    return Response.json({ ok: false, message: errorMsg }, { status: 400 });
  }

  const mandateReference = `BT-MND-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const amountCents = Math.round(body.amount * 100);

  try {
    const result = await createDebitMandate({
      mandateReference,
      donorName: body.donorName.trim(),
      donorEmail: body.donorEmail.trim().toLowerCase(),
      donorPhone: body.donorPhone.trim(),
      province: body.province,
      bankName: body.bankName,
      accountNumberMasked: maskAccountNumber(body.accountNumber),
      accountType: body.accountType,
      branchCode: body.branchCode,
      amountCents,
      collectionDay: body.collectionDay,
      mandateType: body.mandateType,
      authChannel: body.authChannel,
    });

    if (!result.ok) {
      return Response.json(
        { ok: false, mandateReference, message: result.error ?? "Mandate registration failed." },
        { status: 400 },
      );
    }

    return Response.json({
      ok: true,
      mandateReference: result.mandateReference,
      providerMandateId: result.providerMandateId,
      status: result.status,
      authRequired: result.authRequired,
      authInstructions: result.authInstructions,
      message:
        result.authInstructions ||
        "Your debit order mandate request has been created. Please complete authentication through your bank.",
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        message: err instanceof Error ? err.message : "Could not create debit mandate.",
      },
      { status: 500 },
    );
  }
}
