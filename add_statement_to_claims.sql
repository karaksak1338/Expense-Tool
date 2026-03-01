-- Add persistent statement attachment support to claims
ALTER TABLE claims ADD COLUMN IF NOT EXISTS statement_attachment TEXT;
ALTER TABLE claims ADD COLUMN IF NOT EXISTS import_batch_id TEXT;
