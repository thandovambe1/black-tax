import { db } from "@/db";
import { volunteers } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  profession: z.string().min(2),
  province: z.string().min(2),
  availability: z.string().min(2),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await db.insert(volunteers).values(payload);

    return Response.json({
      ok: true,
      message: "Thank you for volunteering. Our team will contact you about suitable opportunities in your province.",
    });
  } catch {
    return Response.json({ ok: false, message: "We could not save your volunteer application right now. Please try again." }, { status: 400 });
  }
}