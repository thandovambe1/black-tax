import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { donorWallMessages } from "@/db/schema";

export const dynamic = "force-dynamic";

const schema = z.object({
  displayName: z.string().min(2).max(120),
  location: z.string().max(120).optional(),
  messageType: z.enum(["support", "tribute", "motivation"]).default("support"),
  message: z.string().min(4).max(500),
  amount: z.number().int().min(1).optional(),
  showAmount: z.boolean().default(false),
});

export async function GET() {
  const rows = await db
    .select()
    .from(donorWallMessages)
    .orderBy(desc(donorWallMessages.id))
    .limit(100);

  return Response.json({
    ok: true,
    messages: rows.map((row) => ({
      id: row.id,
      displayName: row.displayName,
      location: row.location,
      messageType: row.messageType,
      message: row.message,
      amount: row.showAmount ? row.amount : null,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const [inserted] = await db
      .insert(donorWallMessages)
      .values({
        displayName: payload.displayName.trim(),
        location: payload.location?.trim() ?? "",
        messageType: payload.messageType,
        message: payload.message.trim(),
        amount: payload.amount ?? null,
        showAmount: payload.showAmount && payload.amount != null,
      })
      .returning();

    return Response.json({
      ok: true,
      message: "Thank you. Your message is now live on the donor wall.",
      entry: {
        id: inserted.id,
        displayName: inserted.displayName,
        location: inserted.location,
        messageType: inserted.messageType,
        message: inserted.message,
        amount: inserted.showAmount ? inserted.amount : null,
        createdAt: inserted.createdAt.toISOString(),
      },
    });
  } catch {
    return Response.json(
      { ok: false, message: "We could not post your message. Please check your details and try again." },
      { status: 400 },
    );
  }
}