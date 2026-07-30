import { db } from "@/db";
import { memberships } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  contributionAmount: z.number().min(10),
  debitDate: z.string().min(1),
  paymentMethod: z.string().min(1),
  consent: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await db.insert(memberships).values(payload);

    return Response.json({
      ok: true,
      message:
        "Thank you for joining Black Tax. A secure payment onboarding journey will be completed with a licensed South African payments partner.",
    });
  } catch {
    return Response.json({ ok: false, message: "We could not save your membership right now. Please try again." }, { status: 400 });
  }
}