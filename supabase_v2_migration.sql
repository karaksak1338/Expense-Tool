-- V2 Architecture: AI Integration & Multi-Currency Setup
-- Please run this script in your Supabase SQL Editor.

-- 1. Create Exchange Rates Table
CREATE TABLE IF NOT EXISTS "public"."exchange_rates" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "from_currency" text NOT NULL,
    "to_currency" text NOT NULL,
    "exchange_rate" numeric NOT NULL,
    "rate_month" integer NOT NULL,
    "rate_year" integer NOT NULL,
    "rate_type" text DEFAULT 'monthly'::text,
    "source" text DEFAULT 'manual'::text,
    "created_by" uuid,
    "created_at" timestamp with time zone DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Unique constraint to prevent duplicate monthly rates for the same pair
ALTER TABLE "public"."exchange_rates" ADD CONSTRAINT "exchange_rates_month_year_pair_key" UNIQUE ("from_currency", "to_currency", "rate_month", "rate_year");


-- 2. Add AI Metadata Fields to `receipts` table
ALTER TABLE "public"."receipts"
ADD COLUMN IF NOT EXISTS "expense_currency" text,
ADD COLUMN IF NOT EXISTS "gross_amount" numeric,
ADD COLUMN IF NOT EXISTS "vat_percentage" numeric,
ADD COLUMN IF NOT EXISTS "transaction_date" date,
ADD COLUMN IF NOT EXISTS "expense_type" text,
ADD COLUMN IF NOT EXISTS "ai_raw_json" text,
ADD COLUMN IF NOT EXISTS "ai_confidence_score" numeric,
ADD COLUMN IF NOT EXISTS "ai_model_version" text,
ADD COLUMN IF NOT EXISTS "receipt_status" text DEFAULT 'uploaded'::text,
ADD COLUMN IF NOT EXISTS "manual_override_flag" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "file_hash" text,
ADD COLUMN IF NOT EXISTS "duplicate_flag" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "duplicate_reference_id" uuid,
ADD COLUMN IF NOT EXISTS "duplicate_confidence_score" numeric;


-- 3. Add Multi-Currency Logic to `expense_items` table
ALTER TABLE "public"."expense_items"
ADD COLUMN IF NOT EXISTS "expense_currency" text,
ADD COLUMN IF NOT EXISTS "gross_amount" numeric,
ADD COLUMN IF NOT EXISTS "vat_percentage" numeric,
ADD COLUMN IF NOT EXISTS "claim_currency" text,
ADD COLUMN IF NOT EXISTS "claim_amount" numeric,
ADD COLUMN IF NOT EXISTS "exchange_rate" numeric,
ADD COLUMN IF NOT EXISTS "exchange_rate_date" date,
ADD COLUMN IF NOT EXISTS "exchange_rate_source" text;


-- 4. Add V2 Toggles to `entities` table
ALTER TABLE "public"."entities"
ADD COLUMN IF NOT EXISTS "ai_enabled" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "duplicate_sensitivity" text DEFAULT 'strict';
