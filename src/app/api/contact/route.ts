import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await db.insert(contactMessages).values(payload);

    return Response.json({
      ok: true,
      message: "Thank you for contacting Black Tax. We will respond as soon as possible.",
    });
  } catch {
    return Response.json({ ok: false, message: "We could not send your message right now. Please try again." }, { status: 400 });
  }
}