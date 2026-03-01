-- 1. Add Offset Accounts to Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS offset_account_credit_card TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS offset_account_cash TEXT;

-- 2. Add overridden_approver_id to Claims Table
ALTER TABLE claims ADD COLUMN IF NOT EXISTS overridden_approver_id TEXT;
