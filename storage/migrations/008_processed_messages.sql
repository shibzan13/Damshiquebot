-- Track processed WhatsApp messages to prevent duplicate processing
CREATE TABLE IF NOT EXISTS processed_messages (
    message_id TEXT PRIMARY KEY,
    user_phone TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_type TEXT
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processed_messages_timestamp ON processed_messages(processed_at);
