import { z } from "zod";
import { db } from "@/db";
import { auditLogs, financialReports, projects, successStories } from "@/db/schema";
import { getAdminSession } from "@/lib/admin-auth";

const projectSchema = z.object({
  type: z.literal("project"),
  title: z.string().min(3),
  category: z.string().min(2),
  province: z.string().min(2),
  location: z.string().min(2),
  summary: z.string().min(10),
  impact: z.string().min(10),
  amountNeeded: z.number().int().min(1),
  amountFunded: z.number().int().min(0).default(0),
  beneficiaries: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  imageUrl: z.string().url(),
});

const storySchema = z.object({
  type: z.literal("story"),
  name: z.string().min(2),
  title: z.string().min(2),
  location: z.string().min(2),
  quote: z.string().min(10),
  metric: z.string().min(2),
  outcome: z.string().min(10),
  imageUrl: z.string().url(),
});

const reportSchema = z.object({
  type: z.literal("report"),
  title: z.string().min(3),
  periodLabel: z.string().min(2),
  reportType: z.string().min(2),
  summary: z.string().min(10),
  fileUrl: z.string().min(1),
});

const schema = z.discriminatedUnion("type", [projectSchema, storySchema, reportSchema]);

function slugify(value: string) {
  return `${value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ ok: false, message: "Unauthorised." }, { status: 401 });
  }

  try {
    const payload = schema.parse(await request.json());

    if (payload.type === "project") {
      const { type: _type, ...fields } = payload;
      await db.insert(projects).values({ ...fields, slug: slugify(fields.title) });
    } else if (payload.type === "story") {
      const { type: _type, ...fields } = payload;
      await db.insert(successStories).values(fields);
    } else {
      const { type: _type, ...fields } = payload;
      await db.insert(financialReports).values(fields);
    }

    await db.insert(auditLogs).values({
      adminEmail: session.email,
      action: "publish",
      entity: payload.type,
      detail: `Published ${payload.type}: ${payload.title ?? ("name" in payload ? payload.name : "")}`,
    });

    return Response.json({ ok: true, message: `${payload.type} published successfully.` });
  } catch {
    return Response.json({ ok: false, message: "Could not publish. Check all fields and try again." }, { status: 400 });
  }
}