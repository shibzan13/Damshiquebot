-- Migration for Business Automation: Reminders, Approvals, Reconciliation, and Scheduling
-- Database: PostgreSQL

-- 1. Enhance Invoices for Payment Tracking
DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM ('unpaid', 'partially_paid', 'paid', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status payment_status_type DEFAULT 'unpaid';

-- 2. Approval Workflow Rules
CREATE TABLE IF NOT EXISTS approval_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    conditions JSONB NOT NULL, -- e.g., {"min_amount": 1000, "category": "Software"}
    approver_role TEXT NOT NULL DEFAULT 'manager',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Purchase Orders for Reconciliation
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    vendor_name TEXT,
    total_amount NUMERIC(15, 2),
    currency TEXT DEFAULT 'AED',
    status TEXT DEFAULT 'open', -- 'open', 'filled', 'cancelled'
    user_id TEXT,
    description TEXT,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link Invoices to POs
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS po_id UUID REFERENCES purchase_orders(po_id);

-- 4. Recurring Billing / Scheduling
-- We extend the subscriptions concept to allow auto-generation of invoices
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_billing_date DATE;

-- Default sample rules
INSERT INTO approval_rules (name, priority, conditions, approver_role)
VALUES 
('Large Expense Approval', 10, '{"min_amount": 5000}', 'admin'),
('IT Equipment Check', 5, '{"category": "IT & Software"}', 'manager')
ON CONFLICT DO NOTHING;
