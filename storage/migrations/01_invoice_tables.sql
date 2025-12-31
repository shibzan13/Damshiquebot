-- Migration for Invoice Intelligence System
-- Database: PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum for line items status
DO $$ BEGIN
    CREATE TYPE line_items_status_type AS ENUM ('extracted', 'partial', 'unavailable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for invoice status
DO $$ BEGIN
    CREATE TYPE invoice_status_type AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Summary Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Flexible for phone or system ID
    vendor_name TEXT,
    invoice_date DATE,
    currency TEXT DEFAULT 'AED',
    subtotal NUMERIC(15, 2),
    tax_amount NUMERIC(15, 2),
    vat_rate NUMERIC(5, 2) DEFAULT 5.0, -- Standard UAE VAT
    is_vat_reclaimable BOOLEAN DEFAULT FALSE,
    total_amount NUMERIC(15, 2),
    confidence_score NUMERIC(5, 4),
    line_items_status line_items_status_type DEFAULT 'unavailable',
    status invoice_status_type DEFAULT 'pending',
    file_url TEXT,
    file_hash TEXT UNIQUE, 
    whatsapp_media_id TEXT, 
    version INTEGER DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    parent_invoice_id UUID,
    compliance_flags JSONB, -- Results of validation engine
    cost_center TEXT,
    project_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for reporting
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_id ON invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- Line Items Detail Table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    line_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    description TEXT,
    quantity NUMERIC(12, 4),
    unit_price NUMERIC(15, 4),
    tax NUMERIC(15, 4),
    line_total NUMERIC(15, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for detail lookups
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON invoice_line_items(invoice_id);

-- Conversation Context Table
CREATE TABLE IF NOT EXISTS conversation_context (
    user_id TEXT PRIMARY KEY,
    last_invoice_id UUID,
    last_query_type TEXT,
    payload JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification Events Table
CREATE TABLE IF NOT EXISTS notification_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'invoice_received', 'rejected', 'limit_exceeded', 'high_value', etc.
    message TEXT NOT NULL,
    payload JSONB,
    is_delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notification_events(user_id);

-- Audit Trail Table
CREATE TABLE IF NOT EXISTS activity_audit_log (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'submit', 'approve', 'reject', 'edit', 'rerun'
    entity_type TEXT NOT NULL, -- 'invoice', 'budget', 'system'
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    budget_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cost_center TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    allocated_amount NUMERIC(15, 2) NOT NULL,
    spent_amount NUMERIC(15, 2) DEFAULT 0,
    currency TEXT DEFAULT 'AED',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Attachments Table (Supporting Docs)
CREATE TABLE IF NOT EXISTS invoice_attachments (
    attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'delivery_note', 'email_receipt', 'other'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_entity_id ON activity_audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_budgets_cost_center ON budgets(cost_center);

-- System Users Table
CREATE TABLE IF NOT EXISTS system_users (
    phone TEXT PRIMARY KEY, -- WhatsApp Phone Number
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'employee', -- 'employee', 'admin', 'manager'
    is_approved BOOLEAN DEFAULT FALSE,
    dept TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Registration Requests
CREATE TABLE IF NOT EXISTS user_registration_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
