import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers, auditLogs } from "@/db/schema";
import { ADMIN_COOKIE, createSessionToken, ensureAdminSeed, verifyPassword } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    await ensureAdminSeed();
    const { email, password } = schema.parse(await request.json());
    const user = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, email.toLowerCase().trim()),
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return Response.json({ ok: false, message: "Invalid email or password." }, { status: 401 });
    }

    const token = createSessionToken(user.email, user.role, user.fullName);
    const store = await cookies();
    store.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 12 * 60 * 60,
    });

    await db.insert(auditLogs).values({
      adminEmail: user.email,
      action: "login",
      entity: "session",
      detail: `${user.role} signed in`,
    });

    return Response.json({ ok: true, role: user.role, name: user.fullName });
  } catch {
    return Response.json({ ok: false, message: "Login failed. Please try again." }, { status: 400 });
  }
}