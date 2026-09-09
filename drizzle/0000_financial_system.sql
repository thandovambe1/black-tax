-- ============================================================================
-- BLACK TAX — PRODUCTION FINANCIAL SYSTEM MIGRATION
-- Safe, non-destructive. Uses IF NOT EXISTS guards so it can run against an
-- existing production database without dropping or altering existing data.
-- Apply with:  npx drizzle-kit migrate   (or run this SQL directly)
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Enhance existing `donations` table (new columns, all optional/guarded)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(120);
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "fee_amount" integer NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "net_amount" integer NOT NULL DEFAULT 0;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "donor_phone" varchar(40);
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "province" varchar(80) NOT NULL DEFAULT 'Gauteng';
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "payment_method" varchar(60) NOT NULL DEFAULT 'card';
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "mandate_id" integer;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "campaign" varchar(120) DEFAULT 'general';
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "failure_reason" text;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "reconciliation_status" varchar(40) NOT NULL DEFAULT 'MATCHED';
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "settled_at" timestamp with time zone;
ALTER TABLE "donations" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS "donations_idempotency_key_unique" ON "donations" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. debit_mandates — South African DebiCheck / Registered Mandate registration
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "debit_mandates" (
  "id" serial PRIMARY KEY,
  "mandate_reference" varchar(60) NOT NULL,
  "donor_name" varchar(180) NOT NULL,
  "donor_email" varchar(180) NOT NULL,
  "donor_phone" varchar(40) NOT NULL,
  "province" varchar(80) NOT NULL,
  "bank_name" varchar(120) NOT NULL,
  "account_number_masked" varchar(30) NOT NULL,
  "account_type" varchar(40) NOT NULL DEFAULT 'cheque',
  "branch_code" varchar(20) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'ZAR',
  "debit_day" varchar(20) NOT NULL DEFAULT '1st',
  "frequency" varchar(40) NOT NULL DEFAULT 'monthly',
  "start_date" timestamp with time zone DEFAULT now() NOT NULL,
  "end_date" timestamp with time zone,
  "provider" varchar(40) NOT NULL DEFAULT 'netcash',
  "provider_mandate_id" varchar(120),
  "mandate_type" varchar(40) NOT NULL DEFAULT 'debicheck',
  "status" varchar(40) NOT NULL DEFAULT 'DRAFT',
  "auth_channel" varchar(40),
  "auth_timestamp" timestamp with time zone,
  "rejection_reason" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "debit_mandates_mandate_reference_unique" ON "debit_mandates" ("mandate_reference");
CREATE INDEX IF NOT EXISTS "debit_mandates_status_idx" ON "debit_mandates" ("status");
CREATE INDEX IF NOT EXISTS "debit_mandates_provider_mandate_id_idx" ON "debit_mandates" ("provider_mandate_id");

-- ────────────────────────────────────────────────────────────────────────────
-- 3. debit_collections — individual collection runs against active mandates
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "debit_collections" (
  "id" serial PRIMARY KEY,
  "collection_reference" varchar(60) NOT NULL,
  "mandate_id" integer NOT NULL,
  "amount" integer NOT NULL,
  "fee_amount" integer NOT NULL DEFAULT 0,
  "net_amount" integer NOT NULL DEFAULT 0,
  "currency" varchar(8) NOT NULL DEFAULT 'ZAR',
  "collection_date" timestamp with time zone NOT NULL,
  "status" varchar(40) NOT NULL DEFAULT 'PENDING',
  "provider" varchar(40) NOT NULL DEFAULT 'netcash',
  "provider_collection_id" varchar(120),
  "failure_code" varchar(40),
  "failure_reason" text,
  "reconciliation_status" varchar(40) NOT NULL DEFAULT 'MATCHED',
  "settled_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "debit_collections_collection_reference_unique" ON "debit_collections" ("collection_reference");
CREATE UNIQUE INDEX IF NOT EXISTS "debit_collections_provider_collection_id_unique" ON "debit_collections" ("provider_collection_id") WHERE "provider_collection_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "debit_collections_mandate_id_idx" ON "debit_collections" ("mandate_id");
CREATE INDEX IF NOT EXISTS "debit_collections_status_idx" ON "debit_collections" ("status");
CREATE INDEX IF NOT EXISTS "debit_collections_collection_date_idx" ON "debit_collections" ("collection_date");

-- ────────────────────────────────────────────────────────────────────────────
-- 4. financial_ledger — immutable append-only double-entry financial register
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "financial_ledger" (
  "id" serial PRIMARY KEY,
  "entry_reference" varchar(60) NOT NULL,
  "entry_type" varchar(60) NOT NULL,
  "amount" integer NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'ZAR',
  "balance_after" integer NOT NULL DEFAULT 0,
  "related_entity" varchar(40),
  "related_entity_id" integer,
  "description" text NOT NULL,
  "recorded_by" varchar(180) NOT NULL DEFAULT 'system',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "financial_ledger_entry_reference_unique" ON "financial_ledger" ("entry_reference");
CREATE INDEX IF NOT EXISTS "financial_ledger_entry_type_idx" ON "financial_ledger" ("entry_type");
CREATE INDEX IF NOT EXISTS "financial_ledger_created_at_idx" ON "financial_ledger" ("created_at");

-- ────────────────────────────────────────────────────────────────────────────
-- 5. financial_adjustments — controlled, audited manual ledger corrections
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "financial_adjustments" (
  "id" serial PRIMARY KEY,
  "adjustment_reference" varchar(60) NOT NULL,
  "original_transaction_type" varchar(40) NOT NULL,
  "original_transaction_id" integer,
  "reason" text NOT NULL,
  "amount" integer NOT NULL,
  "adjustment_type" varchar(20) NOT NULL,
  "admin_email" varchar(180) NOT NULL,
  "ip_address" varchar(60),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "financial_adjustments_adjustment_reference_unique" ON "financial_adjustments" ("adjustment_reference");

-- ────────────────────────────────────────────────────────────────────────────
-- 6. reconciliation_records — audit runs of the reconciliation engine
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reconciliation_records" (
  "id" serial PRIMARY KEY,
  "batch_reference" varchar(60) NOT NULL,
  "provider" varchar(40) NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "total_internal_transactions" integer NOT NULL DEFAULT 0,
  "total_provider_transactions" integer NOT NULL DEFAULT 0,
  "matched_count" integer NOT NULL DEFAULT 0,
  "mismatch_count" integer NOT NULL DEFAULT 0,
  "discrepancy_cents" integer NOT NULL DEFAULT 0,
  "status" varchar(40) NOT NULL DEFAULT 'MATCHED',
  "details" jsonb DEFAULT '{}'::jsonb,
  "run_by" varchar(180) NOT NULL DEFAULT 'system',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "resolved_at" timestamp with time zone
);

CREATE UNIQUE INDEX IF NOT EXISTS "reconciliation_records_batch_reference_unique" ON "reconciliation_records" ("batch_reference");

-- ────────────────────────────────────────────────────────────────────────────
-- 7. reconciliation_discrepancies — granular mismatch items for controlled review
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "reconciliation_discrepancies" (
  "id" serial PRIMARY KEY,
  "reconciliation_record_id" integer,
  "reference" varchar(60) NOT NULL,
  "provider" varchar(40) NOT NULL,
  "discrepancy_type" varchar(60) NOT NULL,
  "internal_amount" integer,
  "provider_amount" integer,
  "internal_status" varchar(40),
  "provider_status" varchar(40),
  "details" text NOT NULL DEFAULT '',
  "status" varchar(40) NOT NULL DEFAULT 'OPEN',
  "resolved_by" varchar(180),
  "resolution_notes" text,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reconciliation_discrepancies_record_idx" ON "reconciliation_discrepancies" ("reconciliation_record_id");
CREATE INDEX IF NOT EXISTS "reconciliation_discrepancies_status_idx" ON "reconciliation_discrepancies" ("status");

-- ────────────────────────────────────────────────────────────────────────────
-- 8. quarterly_financial_reports — immutable statutory quarterly statements
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "quarterly_financial_reports" (
  "id" serial PRIMARY KEY,
  "quarter_key" varchar(20) NOT NULL,
  "year" integer NOT NULL,
  "quarter_number" integer NOT NULL,
  "period_start" timestamp with time zone NOT NULL,
  "period_end" timestamp with time zone NOT NULL,
  "is_immutable" boolean NOT NULL DEFAULT true,
  "version" integer NOT NULL DEFAULT 1,
  "revision_reason" text,
  "gross_donations_cents" integer NOT NULL DEFAULT 0,
  "debit_collections_cents" integer NOT NULL DEFAULT 0,
  "recurring_donations_cents" integer NOT NULL DEFAULT 0,
  "gross_income_cents" integer NOT NULL DEFAULT 0,
  "fee_amount_cents" integer NOT NULL DEFAULT 0,
  "refunds_cents" integer NOT NULL DEFAULT 0,
  "chargebacks_cents" integer NOT NULL DEFAULT 0,
  "net_funds_cents" integer NOT NULL DEFAULT 0,
  "donor_count" integer NOT NULL DEFAULT 0,
  "successful_tx_count" integer NOT NULL DEFAULT 0,
  "failed_tx_count" integer NOT NULL DEFAULT 0,
  "active_mandate_count" integer NOT NULL DEFAULT 0,
  "province_breakdown" jsonb DEFAULT '{}'::jsonb,
  "month_breakdown" jsonb DEFAULT '{}'::jsonb,
  "payment_method_breakdown" jsonb DEFAULT '{}'::jsonb,
  "reconciliation_summary" jsonb DEFAULT '{}'::jsonb,
  "executive_summary" text NOT NULL DEFAULT '',
  "previous_quarter_total_cents" integer NOT NULL DEFAULT 0,
  "growth_percentage" varchar(20) NOT NULL DEFAULT '0.0%',
  "generated_by" varchar(180) NOT NULL DEFAULT 'system',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "quarterly_financial_reports_quarter_key_unique" ON "quarterly_financial_reports" ("quarter_key");

-- ────────────────────────────────────────────────────────────────────────────
-- 9. financial_audit_logs — immutable financial action audit trail
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
  "id" serial PRIMARY KEY,
  "admin_email" varchar(180) NOT NULL,
  "action" varchar(120) NOT NULL,
  "entity" varchar(80) NOT NULL,
  "entity_id" integer,
  "transaction_reference" varchar(60),
  "previous_state" jsonb,
  "new_state" jsonb,
  "detail" text NOT NULL DEFAULT '',
  "ip_address" varchar(60),
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "financial_audit_logs_created_at_idx" ON "financial_audit_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "financial_audit_logs_admin_email_idx" ON "financial_audit_logs" ("admin_email");
