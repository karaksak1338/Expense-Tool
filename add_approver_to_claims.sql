-- add_approver_to_claims.sql
-- This script adds the approver_id column to the claims table so that the Assigned Approver is locked on the claim level for faster and more reliable routing.

ALTER TABLE public.claims 
ADD COLUMN IF NOT EXISTS approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.claims.approver_id IS 'The ID of the manager/approver assigned to review this claim, resolved at submission time.';
