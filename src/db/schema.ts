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

// ============================================================================
// 1. PUBLIC CONTENT & COMMUNITY
// ============================================================================

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

// ============================================================================
// 2. PRODUCTION-GRADE FINANCIAL SYSTEM (DONATIONS, DEBITS, LEDGER, RECONCILIATION)
// ============================================================================

/**
 * Explicit transaction lifecycle statuses:
 * PENDING, PROCESSING, AUTHORISED, SUCCEEDED, FAILED, CANCELLED, REFUNDED,
 * PARTIALLY_REFUNDED, DISPUTED, CHARGEBACK, RECONCILIATION_REQUIRED
 */
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 60 }).notNull().unique(),
  idempotencyKey: varchar("idempotency_key", { length: 120 }).unique(),
  provider: varchar("provider", { length: 40 }).notNull().default("yoco"), // yoco, netcash, stitch, ozow, manual
  checkoutId: varchar("checkout_id", { length: 120 }),
  providerPaymentId: varchar("provider_payment_id", { length: 120 }),
  amount: integer("amount").notNull(), // stored in minor units (cents) e.g. R100.00 = 10000
  feeAmount: integer("fee_amount").notNull().default(0), // provider fee in cents
  netAmount: integer("net_amount").notNull().default(0), // amount - fee in cents
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  status: varchar("status", { length: 40 }).notNull().default("PENDING"),
  donorName: varchar("donor_name", { length: 180 }).notNull(),
  donorEmail: varchar("donor_email", { length: 180 }).notNull(),
  donorPhone: varchar("donor_phone", { length: 40 }),
  province: varchar("province", { length: 80 }).notNull().default("Gauteng"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  paymentMethod: varchar("payment_method", { length: 60 }).notNull().default("card"), // card, debicheck, eft_debit, instant_eft
  mandateId: integer("mandate_id"),
  campaign: varchar("campaign", { length: 120 }).default("general"),
  failureReason: text("failure_reason"),
  reconciliationStatus: varchar("reconciliation_status", { length: 40 }).notNull().default("MATCHED"), // MATCHED, MISMATCH, MISSING_PROVIDER, REQUIRES_REVIEW
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  // Optional donor-wall message published only after successful verification
  wallMessage: text("wall_message"),
  wallMessageType: varchar("wall_message_type", { length: 40 }),
  wallLocation: varchar("wall_location", { length: 120 }),
  wallShowAmount: boolean("wall_show_amount").notNull().default(false),
  wallPublished: boolean("wall_published").notNull().default(false),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * South African Debit Order Mandate lifecycle:
 * DRAFT, PENDING_CUSTOMER_ACTION, PENDING_BANK_AUTHENTICATION, AUTHORISED,
 * ACTIVE, SUSPENDED, CANCELLED, EXPIRED, REJECTED, FAILED
 *
 * NOTE: NEVER stores sensitive bank credentials, full card numbers, CVVs or online banking passwords.
 * Only stores masked account numbers (last 4 digits) for customer reconciliation.
 */
export const debitMandates = pgTable("debit_mandates", {
  id: serial("id").primaryKey(),
  mandateReference: varchar("mandate_reference", { length: 60 }).notNull().unique(),
  donorName: varchar("donor_name", { length: 180 }).notNull(),
  donorEmail: varchar("donor_email", { length: 180 }).notNull(),
  donorPhone: varchar("donor_phone", { length: 40 }).notNull(),
  province: varchar("province", { length: 80 }).notNull(),
  bankName: varchar("bank_name", { length: 120 }).notNull(), // Absa, FNB, Standard Bank, Nedbank, Capitec, etc.
  accountNumberMasked: varchar("account_number_masked", { length: 30 }).notNull(), // e.g. ****1234
  accountType: varchar("account_type", { length: 40 }).notNull().default("cheque"), // cheque, savings, transmission
  branchCode: varchar("branch_code", { length: 20 }).notNull(),
  amount: integer("amount").notNull(), // minor units (cents)
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  collectionDay: varchar("debit_day", { length: 20 }).notNull().default("1st"), // 1st, 7th, 15th, 20th, 25th, Month End
  frequency: varchar("frequency", { length: 40 }).notNull().default("monthly"),
  startDate: timestamp("start_date", { withTimezone: true }).defaultNow().notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  provider: varchar("provider", { length: 40 }).notNull().default("netcash"), // netcash, stitch, bankserv
  mandateType: varchar("mandate_type", { length: 40 }).notNull().default("debicheck"), // debicheck, registered_mandate, standard_eft
  status: varchar("status", { length: 40 }).notNull().default("DRAFT"),
  authChannel: varchar("auth_channel", { length: 40 }), // ussd, app, atm, branch, online
  authTimestamp: timestamp("auth_timestamp", { withTimezone: true }),
  providerMandateId: varchar("provider_mandate_id", { length: 120 }),
  rejectionReason: text("rejection_reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Individual debit collection events submitted against active mandates.
 */
export const debitCollections = pgTable("debit_collections", {
  id: serial("id").primaryKey(),
  collectionReference: varchar("collection_reference", { length: 60 }).notNull().unique(),
  mandateId: integer("mandate_id").notNull(),
  amount: integer("amount").notNull(), // cents
  feeAmount: integer("fee_amount").notNull().default(0), // cents
  netAmount: integer("net_amount").notNull().default(0), // cents
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  collectionDate: timestamp("collection_date", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 40 }).notNull().default("PENDING"), // PENDING, SUBMITTED, PROCESSING, COLLECTED, FAILED, DISPUTED, RECALLED
  provider: varchar("provider", { length: 40 }).notNull().default("netcash"),
  providerCollectionId: varchar("provider_collection_id", { length: 120 }),
  failureCode: varchar("failure_code", { length: 40 }),
  failureReason: text("failure_reason"),
  reconciliationStatus: varchar("reconciliation_status", { length: 40 }).notNull().default("MATCHED"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Immutable Financial Ledger:
 * Double-entry style append-only record of all financial movements.
 * Historical records are NEVER overwritten; corrections use adjustment entries.
 */
export const financialLedger = pgTable("financial_ledger", {
  id: serial("id").primaryKey(),
  entryReference: varchar("entry_reference", { length: 60 }).notNull().unique(),
  entryType: varchar("entry_type", { length: 60 }).notNull(), // DONATION_GROSS, PAYMENT_FEE, REFUND, CHARGEBACK, DEBIT_COLLECTION_GROSS, DEBIT_COLLECTION_FEE, PAYOUT_DISBURSEMENT, ADJUSTMENT_CREDIT, ADJUSTMENT_DEBIT
  amount: integer("amount").notNull(), // signed or unsigned in minor units (cents)
  currency: varchar("currency", { length: 8 }).notNull().default("ZAR"),
  balanceAfter: integer("balance_after").notNull().default(0),
  relatedEntity: varchar("related_entity", { length: 40 }), // donation, debit_collection, payout, adjustment
  relatedEntityId: integer("related_entity_id"),
  description: text("description").notNull(),
  recordedBy: varchar("recorded_by", { length: 180 }).notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Controlled manual financial adjustments created by authorized administrators.
 */
export const financialAdjustments = pgTable("financial_adjustments", {
  id: serial("id").primaryKey(),
  adjustmentReference: varchar("adjustment_reference", { length: 60 }).notNull().unique(),
  originalTransactionType: varchar("original_transaction_type", { length: 40 }).notNull(),
  originalTransactionId: integer("original_transaction_id"),
  reason: text("reason").notNull(),
  amount: integer("amount").notNull(), // in cents
  adjustmentType: varchar("adjustment_type", { length: 20 }).notNull(), // credit, debit
  adminEmail: varchar("admin_email", { length: 180 }).notNull(),
  ipAddress: varchar("ip_address", { length: 60 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Payouts to verified service providers (e.g. FNB EFT / API).
 */
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

/**
 * Raw payment webhook events for security audit & idempotent deduplication.
 */
export const paymentWebhookEvents = pgTable("payment_webhook_events", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 40 }).notNull(),
  eventId: varchar("event_id", { length: 160 }).notNull().unique(),
  eventType: varchar("event_type", { length: 80 }).notNull().default(""),
  payload: text("payload").notNull().default(""),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Automated Reconciliation Records & Run Summaries.
 */
export const reconciliationRecords = pgTable("reconciliation_records", {
  id: serial("id").primaryKey(),
  batchReference: varchar("batch_reference", { length: 60 }).notNull().unique(),
  provider: varchar("provider", { length: 40 }).notNull(), // yoco, netcash, fnb, all
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  totalInternalTransactions: integer("total_internal_transactions").notNull().default(0),
  totalProviderTransactions: integer("total_provider_transactions").notNull().default(0),
  matchedCount: integer("matched_count").notNull().default(0),
  mismatchCount: integer("mismatch_count").notNull().default(0),
  discrepancyCents: integer("discrepancy_cents").notNull().default(0),
  status: varchar("status", { length: 40 }).notNull().default("MATCHED"), // MATCHED, DISCREPANCIES_FOUND, RESOLVED
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  runBy: varchar("run_by", { length: 180 }).notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

/**
 * Granular discrepancy tracking for reconciliation engine.
 */
export const reconciliationDiscrepancies = pgTable("reconciliation_discrepancies", {
  id: serial("id").primaryKey(),
  reconciliationRecordId: integer("reconciliation_record_id"),
  reference: varchar("reference", { length: 60 }).notNull(),
  provider: varchar("provider", { length: 40 }).notNull(),
  discrepancyType: varchar("discrepancy_type", { length: 60 }).notNull(), // MISSING_INTERNAL, MISSING_PROVIDER, AMOUNT_MISMATCH, STATUS_MISMATCH, DUPLICATE, UNKNOWN
  internalAmount: integer("internal_amount"),
  providerAmount: integer("provider_amount"),
  internalStatus: varchar("internal_status", { length: 40 }),
  providerStatus: varchar("provider_status", { length: 40 }),
  details: text("details").notNull().default(""),
  status: varchar("status", { length: 40 }).notNull().default("OPEN"), // OPEN, RESOLVED, IGNORED
  resolvedBy: varchar("resolved_by", { length: 180 }),
  resolutionNotes: text("resolution_notes"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Immutable Quarterly Financial Reports (Q1 Jan-Mar, Q2 Apr-Jun, Q3 Jul-Sep, Q4 Oct-Dec)
 */
export const quarterlyFinancialReports = pgTable("quarterly_financial_reports", {
  id: serial("id").primaryKey(),
  quarterKey: varchar("quarter_key", { length: 20 }).notNull().unique(), // e.g. "2026-Q1", "2026-Q2"
  year: integer("year").notNull(),
  quarterNumber: integer("quarter_number").notNull(), // 1, 2, 3, 4
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  isImmutable: boolean("is_immutable").notNull().default(true),
  version: integer("version").notNull().default(1),
  revisionReason: text("revision_reason"),
  grossDonationsCents: integer("gross_donations_cents").notNull().default(0),
  debitCollectionsCents: integer("debit_collections_cents").notNull().default(0),
  recurringDonationsCents: integer("recurring_donations_cents").notNull().default(0),
  grossIncomeCents: integer("gross_income_cents").notNull().default(0),
  feeAmountCents: integer("fee_amount_cents").notNull().default(0),
  refundsCents: integer("refunds_cents").notNull().default(0),
  chargebacksCents: integer("chargebacks_cents").notNull().default(0),
  netFundsCents: integer("net_funds_cents").notNull().default(0),
  donorCount: integer("donor_count").notNull().default(0),
  successfulTxCount: integer("successful_tx_count").notNull().default(0),
  failedTxCount: integer("failed_tx_count").notNull().default(0),
  activeMandateCount: integer("active_mandate_count").notNull().default(0),
  provinceBreakdown: jsonb("province_breakdown").$type<Record<string, unknown>>().default({}),
  monthBreakdown: jsonb("month_breakdown").$type<Record<string, unknown>>().default({}),
  paymentMethodBreakdown: jsonb("payment_method_breakdown").$type<Record<string, unknown>>().default({}),
  reconciliationSummary: jsonb("reconciliation_summary").$type<Record<string, unknown>>().default({}),
  executiveSummary: text("executive_summary").notNull().default(""),
  previousQuarterTotalCents: integer("previous_quarter_total_cents").notNull().default(0),
  growthPercentage: varchar("growth_percentage", { length: 20 }).notNull().default("0.0%"),
  generatedBy: varchar("generated_by", { length: 180 }).notNull().default("system"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Immutable Financial Audit Logs:
 * Captures previous state, new state, IP/device metadata, and authorized actor.
 */
export const financialAuditLogs = pgTable("financial_audit_logs", {
  id: serial("id").primaryKey(),
  adminEmail: varchar("admin_email", { length: 180 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entity: varchar("entity", { length: 80 }).notNull(),
  entityId: integer("entity_id"),
  transactionReference: varchar("transaction_reference", { length: 60 }),
  previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
  newState: jsonb("new_state").$type<Record<string, unknown>>(),
  detail: text("detail").notNull().default(""),
  ipAddress: varchar("ip_address", { length: 60 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
