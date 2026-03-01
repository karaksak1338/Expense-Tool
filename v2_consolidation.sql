/**
 * CONSOLIDATED V3 UPDATE: FISCAL ALIGNMENT & DUAL-CURRENCY
 * Run this in your Supabase SQL Editor.
 * This script is idempotent (safe to run multiple times).
 */

-- 1. Ensure 'claims' table has all V2+ columns
ALTER TABLE "public"."claims" 
ADD COLUMN IF NOT EXISTS "claim_type" text DEFAULT 'CashReimbursement',
ADD COLUMN IF NOT EXISTS "statement_attachment" text,
ADD COLUMN IF NOT EXISTS "import_batch_id" text,
ADD COLUMN IF NOT EXISTS "submission_date" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "approval_date" timestamp with time zone;

-- 2. Ensure 'expense_items' table has all V2+ columns for Dual-Currency & Auditing
-- Note: 'amount' remains as the "Transaction Amount" for receipt matching.
-- 'billing_amount' is the "Account Amount" for financial posting.
ALTER TABLE "public"."expense_items"
ADD COLUMN IF NOT EXISTS "payment_type" text DEFAULT 'CashReimbursement',
ADD COLUMN IF NOT EXISTS "immutable" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "external_reference" text,
ADD COLUMN IF NOT EXISTS "billing_amount" numeric,
ADD COLUMN IF NOT EXISTS "billing_currency" text,
ADD COLUMN IF NOT EXISTS "expense_currency" text,
ADD COLUMN IF NOT EXISTS "gross_amount" numeric,
ADD COLUMN IF NOT EXISTS "claim_currency" text,
ADD COLUMN IF NOT EXISTS "claim_amount" numeric,
ADD COLUMN IF NOT EXISTS "exchange_rate" numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS "exchange_rate_date" date,
ADD COLUMN IF NOT EXISTS "exchange_rate_source" text,
ADD COLUMN IF NOT EXISTS "allocation_status" text DEFAULT 'MANUAL';

-- 3. Update existing 'amount' to numeric if it's currently int/float (Optional safety)
-- ALTER TABLE "public"."expense_items" ALTER COLUMN "amount" TYPE numeric;

COMMENT ON COLUMN "public"."expense_items"."billing_amount" IS 'The final amount charged to the bank account in the company/entity currency.';
COMMENT ON COLUMN "public"."expense_items"."amount" IS 'The original transaction amount as seen on the receipt, used for automated matching.';
