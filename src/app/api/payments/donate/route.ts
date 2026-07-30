import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { createYocoCheckout, isYocoConfigured } from "@/lib/payments/yoco";

export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().int().min(10), // rand
  donorName: z.string().min(2).max(180),
  donorEmail: z.string().email(),
  isRecurring: z.boolean().default(false),
  wallMessage: z.string().max(500).optional(),
  wallMessageType: z.enum(["support", "tribute", "motivation"]).optional(),
  wallLocation: z.string().max(120).optional(),
  wallShowAmount: z.boolean().default(false),
});

function makeReference() {
  return `BT-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  let payload: z.infer<typeof schema>;
  try {
    payload = schema.parse(await request.json());
  } catch {
    return Response.json({ ok: false, message: "Please check the donation details and try again." }, { status: 400 });
  }

  const reference = makeReference();
  const amountCents = Math.round(payload.amount * 100);

  // Always record the donation attempt first (status: created), so nothing is lost.
  const [donation] = await db
    .insert(donations)
    .values({
      reference,
      provider: "yoco",
      amount: amountCents,
      currency: "ZAR",
      status: "created",
      donorName: payload.donorName.trim(),
      donorEmail: payload.donorEmail.trim().toLowerCase(),
      isRecurring: payload.isRecurring,
      wallMessage: payload.wallMessage?.trim() || null,
      wallMessageType: payload.wallMessageType ?? null,
      wallLocation: payload.wallLocation?.trim() || null,
      wallShowAmount: payload.wallShowAmount,
    })
    .returning();

  if (!isYocoConfigured()) {
    return Response.json(
      {
        ok: false,
        configured: false,
        reference,
        message:
          "Your donation has been recorded. Live card payments activate as soon as the Yoco payment gateway credentials are configured.",
      },
      { status: 202 },
    );
  }

  const checkout = await createYocoCheckout({
    amount: amountCents,
    reference,
    metadata: {
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      recurring: String(donation.isRecurring),
    },
  });

  if (!checkout.ok) {
    await db
      .update(donations)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eqReference(donation.id));
    return Response.json({ ok: false, message: checkout.error }, { status: 502 });
  }

  await db
    .update(donations)
    .set({ checkoutId: checkout.checkoutId, status: "pending", updatedAt: new Date() })
    .where(eqReference(donation.id));

  return Response.json({ ok: true, reference, redirectUrl: checkout.redirectUrl });
}

function eqReference(id: number) {
  return eq(donations.id, id);
}
