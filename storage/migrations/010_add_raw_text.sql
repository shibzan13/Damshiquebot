-- Add raw_text column to invoices table for RAG capabilities
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS raw_text TEXT;
