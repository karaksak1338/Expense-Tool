-- DCBI Expense Tool - Supabase Schema (Refined for existing IDs)

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Entities
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  country TEXT,
  country_iso3 CHAR(3),
  logo TEXT,
  mandatory_fields JSONB DEFAULT '{"project": true, "department": true}',
  expense_mappings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Users Registry
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  roles TEXT[] DEFAULT '{STAFF}',
  entity_id TEXT REFERENCES entities(id),
  approver_id TEXT REFERENCES users(id),
  assigned_entities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Projects
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  active BOOLEAN DEFAULT true
);

-- 4. Departments
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  active BOOLEAN DEFAULT true
);

-- 5. Expense Types
CREATE TABLE expense_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  default_account TEXT,
  default_vat NUMERIC DEFAULT 0,
  requires_entertainment BOOLEAN DEFAULT false
);

-- 6. Claims
CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  entity_id TEXT REFERENCES entities(id),
  advance_amount NUMERIC DEFAULT 0,
  claim_status TEXT DEFAULT 'NEW',
  approval_status TEXT DEFAULT 'N/A',
  submission_date TIMESTAMPTZ,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Expense Items
CREATE TABLE expense_items (
  id TEXT PRIMARY KEY,
  claim_id TEXT REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT,
  amount NUMERIC NOT NULL,
  currency CHAR(3) DEFAULT 'EUR',
  payment TEXT DEFAULT 'REIMBURSABLE',
  receipt TEXT,
  project TEXT,
  department TEXT,
  description TEXT,
  backlog_id TEXT,
  clients TEXT,
  attendees INTEGER,
  purpose TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Receipts Backlog
CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  amount_suggestion NUMERIC,
  vendor_suggestion TEXT,
  status TEXT DEFAULT 'UNALLOCATED',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
