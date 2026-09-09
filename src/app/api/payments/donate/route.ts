import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { yocoProvider } from "@/lib/payments/yoco";
import { SA_PROVINCES, type SouthAfricanProvince } from "@/lib/payments/types";
import { logFinancialAction } from "@/lib/financial-reporting/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().int().min(10).max(500000), // R10 to R500,000 in integer Rand
  donorName: z.string().min(2).max(180),
  donorEmail: z.string().email().max(180),
  donorPhone: z.string().max(40).optional(),
  province: z.enum(SA_PROVINCES as [SouthAfricanProvince, ...SouthAfricanProvince[]]).default("Gauteng"),
  isRecurring: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  wallMessage: z.string().max(500).optional(),
  wallMessageType: z.enum(["support", "tribute", "motivation"]).optional(),
  wallLocation: z.string().max(120).optional(),
  wallShowAmount: z.boolean().default(false),
});

function makeReference(): string {
  return `BT-DON-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch (err) {
    const errorMsg =
      err instanceof z.ZodError
        ? err.issues?.[0]?.message ?? err.message
        : "Invalid donation data.";
    return Response.json({ ok: false, message: errorMsg }, { status: 400 });
  }

  const reference = makeReference();
  const amountCents = Math.round(payload.amount * 100);

  // 1. Record pending donation in database with explicit initial state (PENDING)
  const [donation] = await db
    .insert(donations)
    .values({
      reference,
      provider: "yoco",
      amount: amountCents,
      currency: "ZAR",
      status: "PENDING",
      donorName: payload.donorName.trim(),
      donorEmail: payload.donorEmail.trim().toLowerCase(),
      donorPhone: payload.donorPhone?.trim() || null,
      province: payload.province,
      isRecurring: payload.isRecurring,
      isAnonymous: payload.isAnonymous,
      paymentMethod: "card",
      wallMessage: payload.wallMessage?.trim() || null,
      wallMessageType: payload.wallMessageType ?? null,
      wallLocation: payload.wallLocation?.trim() || null,
      wallShowAmount: payload.wallShowAmount,
      metadata: {
        source: "website_donate_form",
        ip: request.headers.get("x-forwarded-for") ?? "unknown",
      },
    })
    .returning();

  await logFinancialAction({
    adminEmail: "system",
    action: "donation intent created",
    entity: "donation",
    entityId: donation.id,
    transactionReference: reference,
    newState: { reference, amountCents, status: "PENDING", province: payload.province },
    detail: `Donation intent ${reference} created for R${payload.amount} (${payload.isRecurring ? "monthly recurring" : "once-off"})`,
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
  });

  // 2. Check if Yoco gateway is configured
  if (!yocoProvider.isConfigured()) {
    return Response.json(
      {
        ok: false,
        configured: false,
        reference,
        message:
          "Your donation intent has been recorded in our ledger. Live card checkout will activate when YOCO_SECRET_KEY is configured in Vercel environment variables.",
      },
      { status: 202 },
    );
  }

  // 3. Request authoritative checkout session from Yoco
  const checkoutResult = await yocoProvider.createCheckout({
    amountCents,
    reference,
    donorName: donation.donorName,
    donorEmail: donation.donorEmail,
    donorPhone: donation.donorPhone ?? undefined,
    province: payload.province,
    isRecurring: donation.isRecurring,
    isAnonymous: donation.isAnonymous,
    metadata: {
      donationId: String(donation.id),
      campaign: "general",
    },
  });

  if (!checkoutResult.ok) {
    await db
      .update(donations)
      .set({
        status: "FAILED",
        failureReason: checkoutResult.error,
        updatedAt: new Date(),
      })
      .where(eq(donations.id, donation.id));

    return Response.json({ ok: false, message: checkoutResult.error }, { status: 502 });
  }

  // 4. Update status to PROCESSING with provider checkout ID
  await db
    .update(donations)
    .set({
      checkoutId: checkoutResult.checkoutId,
      status: "PROCESSING",
      updatedAt: new Date(),
    })
    .where(eq(donations.id, donation.id));

  return Response.json({
    ok: true,
    reference,
    redirectUrl: checkoutResult.redirectUrl,
  });
}
