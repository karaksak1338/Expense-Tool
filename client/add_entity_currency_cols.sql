-- add_entity_currency_cols.sql
-- Run this in your Supabase SQL Editor to support entity-specific currencies.

ALTER TABLE public.entities
ADD COLUMN IF NOT EXISTS primary_currency text,
ADD COLUMN IF NOT EXISTS secondary_currency text;

-- Add comment for documentation
COMMENT ON COLUMN public.entities.primary_currency IS 'Primary reporting and claim currency for this legal entity';
COMMENT ON COLUMN public.entities.secondary_currency IS 'Secondary currency allowed for claims for this legal entity';
