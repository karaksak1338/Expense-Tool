-- Optional: Ensure data integrity before creating the foreign key
-- If there are orphan backlog_ids, you might want to set them to null first or delete them.
-- UPDATE expense_items SET backlog_id = NULL WHERE backlog_id IS NOT NULL AND backlog_id NOT IN (SELECT id FROM receipts);

-- Add the Foreign Key constraint
ALTER TABLE expense_items
ADD CONSTRAINT fk_expense_items_receipt
FOREIGN KEY (backlog_id)
REFERENCES receipts(id)
ON DELETE SET NULL; -- If a receipt is deleted from the library, it just unlinks from the expense item

-- Make sure receipts doesn't have a claim_id (it shouldn't based on the schema, but just in case)
-- ALTER TABLE receipts DROP COLUMN IF EXISTS claim_id;
