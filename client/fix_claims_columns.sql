-- SQL Fix: Ensure claims table has all necessary columns for v1.0.0021
-- Run this in your Supabase SQL Editor.

-- Add submission_date if missing
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "submission_date" timestamptz;

-- Add history if missing (jsonb for structured audit trail)
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "history" jsonb DEFAULT '[]'::jsonb;

-- Add claim_type if missing
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "claim_type" text DEFAULT 'CashReimbursement';

-- Add currency if missing
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "currency" text;

-- Add statement_attachment and import_batch_id
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "statement_attachment" text;
ALTER TABLE "public"."claims" ADD COLUMN IF NOT EXISTS "import_batch_id" text;

-- Verify columns exist (informational)
DO $$ 
BEGIN
    RAISE NOTICE 'Schema patch (v21) applied successfully.';
END $$;
