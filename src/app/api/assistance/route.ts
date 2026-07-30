import { db } from "@/db";
import { assistanceRequests } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  province: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(20),
  monthlyIncome: z.number().min(0).optional(),
  documents: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await db.insert(assistanceRequests).values({
      ...payload,
      documents: payload.documents
        ? payload.documents
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    });

    return Response.json({
      ok: true,
      message:
        "Your request has been submitted for governance review. Funding decisions remain subject to policy checks, supporting documents and available funds.",
    });
  } catch {
    return Response.json({ ok: false, message: "We could not submit your request right now. Please review your details and try again." }, { status: 400 });
  }
}