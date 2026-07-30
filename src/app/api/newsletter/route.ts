import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    await db
      .insert(newsletterSubscribers)
      .values({ email: payload.email.toLowerCase().trim() })
      .onConflictDoNothing({ target: newsletterSubscribers.email });

    return Response.json({
      ok: true,
      message: "You are subscribed. Expect transparent updates, impact reports and community news.",
    });
  } catch {
    return Response.json(
      { ok: false, message: "Please enter a valid email address and try again." },
      { status: 400 },
    );
  }
}