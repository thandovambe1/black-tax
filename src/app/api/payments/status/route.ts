import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("ref");
  if (!reference) {
    return Response.json({ ok: false, message: "Missing reference." }, { status: 400 });
  }

  const donation = await db.query.donations.findFirst({
    where: eq(donations.reference, reference),
  });

  if (!donation) {
    return Response.json({ ok: false, message: "Donation not found." }, { status: 404 });
  }

  return Response.json({
    ok: true,
    reference: donation.reference,
    status: donation.status,
    amount: donation.amount,
    donorName: donation.donorName,
    isRecurring: donation.isRecurring,
  });
}
