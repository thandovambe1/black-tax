import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  location: varchar("location", { length: 140 }).notNull(),
  summary: text("summary").notNull(),
  impact: text("impact").notNull(),
  amountNeeded: integer("amount_needed").notNull(),
  amountFunded: integer("amount_funded").notNull().default(0),
  beneficiaries: integer("beneficiaries").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const successStories = pgTable("success_stories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  quote: text("quote").notNull(),
  metric: varchar("metric", { length: 120 }).notNull(),
  outcome: text("outcome").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const financialReports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  periodLabel: varchar("period_label", { length: 120 }).notNull(),
  reportType: varchar("report_type", { length: 80 }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
  fileUrl: text("file_url").notNull(),
  summary: text("summary").notNull(),
});

export const memberships = pgTable("memberships", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  contributionAmount: integer("contribution_amount").notNull(),
  debitDate: varchar("debit_date", { length: 40 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 60 }).notNull(),
  consent: boolean("consent").notNull().default(true),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  role: varchar("role", { length: 40 }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminEmail: varchar("admin_email", { length: 180 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: integer("entity_id"),
  detail: text("detail").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const assistanceRequests = pgTable("assistance_requests", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  monthlyIncome: integer("monthly_income"),
  documents: jsonb("documents").$type<string[]>().notNull().default([]),
  status: varchar("status", { length: 40 }).notNull().default("submitted"),
  paymentStatus: varchar("payment_status", { length: 40 }).notNull().default("unpaid"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const volunteers = pgTable("volunteers", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 180 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  profession: varchar("profession", { length: 120 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  availability: varchar("availability", { length: 80 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 180 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  subject: varchar("subject", { length: 180 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 60 }).notNull().unique(),
  provider: varchar("provider", { length: 40 }).notNull().default("yoco"),
  checkoutId: varchar("checkout_id", { length: 120 }),
  providerPaymentId: varchar("provider_payment_id", { length: 120 }),
  amount: integer("amount").notNull(), // stored in cents
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  status: varchar("status", { length: 40 }).notNull().default("created"),
  donorName: varchar("donor_name", { length: 180 }).notNull(),
  donorEmail: varchar("donor_email", { length: 180 }).notNull(),
  isRecurring: boolean("is_recurring").notNull().default(false),
  // Optional donor-wall message published on successful payment
  wallMessage: text("wall_message"),
  wallMessageType: varchar("wall_message_type", { length: 40 }),
  wallLocation: varchar("wall_location", { length: 120 }),
  wallShowAmount: boolean("wall_show_amount").notNull().default(false),
  wallPublished: boolean("wall_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 60 }).notNull().unique(),
  provider: varchar("provider", { length: 40 }).notNull().default("fnb"),
  beneficiaryName: varchar("beneficiary_name", { length: 180 }).notNull(),
  beneficiaryBank: varchar("beneficiary_bank", { length: 120 }).notNull().default("FNB"),
  beneficiaryAccount: varchar("beneficiary_account", { length: 40 }).notNull(),
  branchCode: varchar("branch_code", { length: 20 }).notNull(),
  amount: integer("amount").notNull(), // stored in cents
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  purpose: varchar("purpose", { length: 200 }).notNull().default(""),
  assistanceRequestId: integer("assistance_request_id"),
  status: varchar("status", { length: 40 }).notNull().default("pending"),
  batchReference: varchar("batch_reference", { length: 60 }),
  createdBy: varchar("created_by", { length: 180 }).notNull().default(""),
  releasedBy: varchar("released_by", { length: 180 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  releasedAt: timestamp("released_at", { withTimezone: true }),
});

export const paymentWebhookEvents = pgTable("payment_webhook_events", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  eventId: varchar("event_id", { length: 160 }).notNull().unique(),
  eventType: varchar("event_type", { length: 80 }).notNull().default(""),
  payload: text("payload").notNull().default(""),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

export const donorWallMessages = pgTable("donor_wall_messages", {
  id: serial("id").primaryKey(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  location: varchar("location", { length: 120 }).notNull().default(""),
  messageType: varchar("message_type", { length: 40 }).notNull().default("support"),
  message: text("message").notNull(),
  amount: integer("amount"),
  showAmount: boolean("show_amount").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});