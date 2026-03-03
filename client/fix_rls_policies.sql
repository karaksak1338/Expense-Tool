-- SQL Fix: Grant missing permissions and fix RLS policies for "claims"
-- Run this in your Supabase SQL Editor.

-- 1. Ensure the "authenticated" role can use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 2. Drop and Recreate RLS Policies for "claims" to be absolutely sure
DROP POLICY IF EXISTS "Users can create their own claims" ON "public"."claims";
DROP POLICY IF EXISTS "Users can view their own claims" ON "public"."claims";
DROP POLICY IF EXISTS "Users can update their own claims" ON "public"."claims";
DROP POLICY IF EXISTS "Everyone can select claims" ON "public"."claims";

-- POLICY: INSERT (Allow users to insert if they own the record)
CREATE POLICY "Users can insert their own claims" 
ON "public"."claims" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- POLICY: SELECT (Allow users to see their own claims)
CREATE POLICY "Users can select their own claims" 
ON "public"."claims" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- POLICY: UPDATE (Allow users to update their own claims)
CREATE POLICY "Users can update their own claims" 
ON "public"."claims" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Enable RLS (just in case it was disabled)
ALTER TABLE "public"."claims" ENABLE ROW LEVEL SECURITY;

-- 4. Verify (informational)
DO $$ 
BEGIN
    RAISE NOTICE 'Permissions and RLS policies for "claims" have been refreshed.';
END $$;
