-- V4: Consolidated Draft Persistence & Fiscal Schema
-- Run this in your Supabase SQL Editor.

-- 1. Ensure 'claims' has a currency column (avoiding fragile derivation)
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "currency" text;

-- 2. Ensure 'claims' has all tracking columns for Statement/AI imports
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "claim_type" text DEFAULT 'CashReimbursement';
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "statement_attachment" text;
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "import_batch_id" text;

-- 3. Cleanup: Update 'currency' on claims based on the ID suffix if it's currently null
UPDATE "public"."claims" 
SET "currency" = SUBSTRING(id FROM '-([A-Z]{3})$')
WHERE "currency" IS NULL AND id ~ '-[A-Z]{3}$';

-- 4. Final safety for 'expense_items'
ALTER TABLE "public"."expense_items" ADD COLUMN IF NOT EXISTS "payment_type" text DEFAULT 'CashReimbursement';
ALTER TABLE "public"."expense_items" ADD COLUMN IF NOT EXISTS "exchange_rate_date" date;
