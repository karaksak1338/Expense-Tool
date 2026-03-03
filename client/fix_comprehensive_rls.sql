-- SQL Fix: Grant permissions and fix RLS policies for all claim-related tables
-- This covers claims, expense_items, and receipts.
-- Run this in your Supabase SQL Editor.

-- 1. Ensure "authenticated" role has schema usage
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-----------------------------------------------------------
-- TABLE: claims (Refreshed)
-----------------------------------------------------------
ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own claims" ON "public"."claims";
DROP POLICY IF EXISTS "Users can select their own claims" ON "public"."claims";
DROP POLICY IF EXISTS "Users can update their own claims" ON "public"."claims";

CREATE POLICY "Users can insert their own claims" 
ON "public"."claims" FOR INSERT TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can select their own claims" 
ON "public"."claims" FOR SELECT TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own claims" 
ON "public"."claims" FOR UPDATE TO authenticated 
USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);


-----------------------------------------------------------
-- TABLE: expense_items
-----------------------------------------------------------
ALTER TABLE "public"."expense_items" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert expense_items for their claims" ON "public"."expense_items";
DROP POLICY IF EXISTS "Users can select expense_items for their claims" ON "public"."expense_items";
DROP POLICY IF EXISTS "Users can update expense_items for their claims" ON "public"."expense_items";
DROP POLICY IF EXISTS "Users can delete expense_items for their claims" ON "public"."expense_items";

-- Using a subquery to check ownership of the parent claim
CREATE POLICY "Users can insert expense_items for their claims" 
ON "public"."expense_items" FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.claims 
    WHERE public.claims.id = claim_id 
    AND public.claims.user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can select expense_items for their claims" 
ON "public"."expense_items" FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.claims 
    WHERE public.claims.id = claim_id 
    AND public.claims.user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can update expense_items for their claims" 
ON "public"."expense_items" FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.claims 
    WHERE public.claims.id = claim_id 
    AND public.claims.user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can delete expense_items for their claims" 
ON "public"."expense_items" FOR DELETE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.claims 
    WHERE public.claims.id = claim_id 
    AND public.claims.user_id = auth.uid()::text
  )
);


-----------------------------------------------------------
-- TABLE: receipts (Library items)
-----------------------------------------------------------
ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own receipts" ON "public"."receipts";
DROP POLICY IF EXISTS "Users can insert their own receipts" ON "public"."receipts";
DROP POLICY IF EXISTS "Users can select their own receipts" ON "public"."receipts";
DROP POLICY IF EXISTS "Users can update their own receipts" ON "public"."receipts";
DROP POLICY IF EXISTS "Users can delete their own receipts" ON "public"."receipts";

CREATE POLICY "Users can insert their own receipts" 
ON "public"."receipts" FOR INSERT TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can select their own receipts" 
ON "public"."receipts" FOR SELECT TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own receipts" 
ON "public"."receipts" FOR UPDATE TO authenticated 
USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own receipts" 
ON "public"."receipts" FOR DELETE TO authenticated 
USING (auth.uid()::text = user_id);

-- 4. Final Notification
DO $$ 
BEGIN
    RAISE NOTICE 'Permissions and RLS policies for claims, expense_items, and receipts have been refreshed.';
END $$;
