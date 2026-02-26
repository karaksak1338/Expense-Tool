-- DATA MIGRATION SCRIPT

-- Entities
INSERT INTO entities (id, name, code, address, country, country_iso3, logo, mandatory_fields) VALUES
('E1', 'DCBI Global Ltd.', 'D001', '123 Business Way, London', 'United Kingdom', 'GBR', '🌐', '{"project": true, "department": true}'),
('E2', 'DCBI Core SAS', 'C092', '45 Finance Ave, Paris', 'France', 'FRA', '💳', '{"project": false, "department": true}');

-- Users
INSERT INTO users (id, name, email, roles, entity_id, approver_id) VALUES
('1', 'Adam Staff', 'adam@dcbi.com', '{STAFF}', 'E1', '3'),
('2', 'Sarah Accountant', 'sarah@dcbi.com', '{ACCOUNTANT}', 'E1', NULL),
('3', 'Mark Manager', 'mark@dcbi.com', '{MANAGER}', 'E1', NULL),
('4', 'Super Admin', 'admin@dcbi.com', '{ADMIN}', 'E1', NULL),
('5', 'John StaffManager', 'john@dcbi.com', '{STAFF, MANAGER}', 'E1', '4'),
('6', 'Emily StaffAcc', 'emily@dcbi.com', '{STAFF, ACCOUNTANT}', 'E1', '3'),
('7', 'Chris StaffAdmin', 'chris@dcbi.com', '{STAFF, ADMIN}', 'E1', '3');

-- Projects
INSERT INTO projects (id, name, code) VALUES
('P1', 'PRJ-24-XT (Customer X)', 'XT001'),
('P2', 'Internal - Marketing', 'MKT-INT'),
('P3', 'Infrastructure Upgrade', 'INF-UPG');

-- Departments
INSERT INTO departments (id, name, code) VALUES
('D1', 'D-SALES', 'SALES'),
('D2', 'D-FINANCE', 'FIN'),
('D3', 'D-ENGINEERING', 'ENG');

-- Expense Types
INSERT INTO expense_types (id, label, default_account, default_vat, requires_entertainment) VALUES
('T1', 'Flight', '600100', 0, false),
('T2', 'Hotel', '600200', 7, false),
('T3', 'Entertainment', '600300', 19, true),
('T4', 'Other', '600900', 19, false);
