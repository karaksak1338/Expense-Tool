-- fix_approver_id_type.sql
-- The previous script mapped approver_id to UUID, but the app uses TEXT for user IDs like "1", "3", and "USR-...".
-- This script fixes the column type by dropping the UUID column and recreating it as TEXT.

ALTER TABLE public.claims DROP COLUMN IF EXISTS approver_id;

ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS approver_id TEXT;

COMMENT ON COLUMN public.claims.approver_id IS 'The ID of the manager/approver assigned to review this claim, resolved at submission time (TEXT format to match user_id).';
