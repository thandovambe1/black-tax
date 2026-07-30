import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";

const SECRET = process.env.ADMIN_SESSION_SECRET ?? "blacktax-admin-session-secret-change-in-production";
export const ADMIN_COOKIE = "bt_admin_session";
const SESSION_HOURS = 12;

// Roles:
// - owner   : full access to everything admin + finance can do
// - admin   : sees everything admin related
// - finance : admin visibility, focused on finance — approving and releasing
//             payment requests to service providers
export const ADMIN_ACCOUNTS = [
  {
    email: "admin1@blacktax.co.za",
    password: "Lina@0120",
    fullName: "Owner",
    role: "owner",
  },
  {
    email: "admin@blacktax.co.za",
    password: "3l@ckt!x2026",
    fullName: "Administrator",
    role: "admin",
  },
  {
    email: "finance@blacktax.co.za",
    password: "3l@ckt!xf!nance2026",
    fullName: "Finance Officer",
    role: "finance",
  },
] as const;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export type AdminSession = { email: string; role: string; name: string; exp: number };

export function createSessionToken(email: string, role: string, name: string) {
  const payload = Buffer.from(
    JSON.stringify({ email, role, name, exp: Date.now() + SESSION_HOURS * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as AdminSession;
    if (!data.email || !data.role || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function ensureAdminSeed() {
  const allowedEmails = ADMIN_ACCOUNTS.map((account) => account.email);

  // Remove any admin account that is not one of the three authorised logins.
  const existing = await db.select().from(adminUsers);
  const staleEmails = existing
    .filter((row) => !allowedEmails.includes(row.email as (typeof allowedEmails)[number]))
    .map((row) => row.email);
  if (staleEmails.length > 0) {
    await db.delete(adminUsers).where(inArray(adminUsers.email, staleEmails));
  }

  // Upsert the three authorised accounts so credentials and roles stay correct.
  for (const account of ADMIN_ACCOUNTS) {
    await db
      .insert(adminUsers)
      .values({
        email: account.email,
        passwordHash: hashPassword(account.password),
        fullName: account.fullName,
        role: account.role,
      })
      .onConflictDoUpdate({
        target: adminUsers.email,
        set: {
          passwordHash: hashPassword(account.password),
          fullName: account.fullName,
          role: account.role,
        },
      });
  }
}