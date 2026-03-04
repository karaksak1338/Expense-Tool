-- DCBI Expense Tool - RLS comprehensive Patch

-- If Row Level Security (RLS) is enabled without explicitly defined policies, 
-- Supabase defaults to "Deny All" for the standard API client.
-- This script safely grants authenticated users the ability to read and write to the 
-- foundational dictionary tables, restoring full visibility to the Admin Control Center.

-- 1. Users Table
DROP POLICY IF EXISTS "Allow authenticated full access users" ON users;
CREATE POLICY "Allow authenticated full access users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Entities Table
DROP POLICY IF EXISTS "Allow authenticated full access entities" ON entities;
CREATE POLICY "Allow authenticated full access entities" ON entities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Projects, Departments, Expense Types, Exchange Rates, Prompts
DROP POLICY IF EXISTS "Allow authenticated full access departments" ON departments;
CREATE POLICY "Allow authenticated full access departments" ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access projects" ON projects;
CREATE POLICY "Allow authenticated full access projects" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access expense_types" ON expense_types;
CREATE POLICY "Allow authenticated full access expense_types" ON expense_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access exchange_rates" ON exchange_rates;
CREATE POLICY "Allow authenticated full access exchange_rates" ON exchange_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access ai_prompts" ON ai_prompts;
CREATE POLICY "Allow authenticated full access ai_prompts" ON ai_prompts FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access user_entity_approvers" ON user_entity_approvers;
CREATE POLICY "Allow authenticated full access user_entity_approvers" ON user_entity_approvers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Claims and Receipts (General access for now to fix visibility issues, backend API enforces strict rules)
DROP POLICY IF EXISTS "Allow authenticated full access claims" ON claims;
CREATE POLICY "Allow authenticated full access claims" ON claims FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access expense_items" ON expense_items;
CREATE POLICY "Allow authenticated full access expense_items" ON expense_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access receipts" ON receipts;
CREATE POLICY "Allow authenticated full access receipts" ON receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);
