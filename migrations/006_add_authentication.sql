-- Migration: Add authentication fields to system_users table
-- Date: 2026-01-02

-- Add username, password_hash, session_token, and last_login columns
ALTER TABLE system_users 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS session_token VARCHAR(64) UNIQUE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- Create index on session_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_users_session_token ON system_users(session_token);
CREATE INDEX IF NOT EXISTS idx_system_users_username ON system_users(username);

-- Insert default admin user (username: admin, password: Michu)
-- Password hash is SHA-256 of "damshique_default_salt_2024Michu"
INSERT INTO system_users (phone, name, username, password_hash, role, is_approved)
VALUES (
    '+000000000', 
    'System Administrator', 
    'admin', 
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    'admin', 
    TRUE
)
ON CONFLICT (phone) DO UPDATE 
SET 
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved;

-- Note: The default password is 'Michu'. 
-- IMPORTANT: Change this password immediately after first login!
-- You can update it by running:
-- UPDATE system_users SET password_hash = '<new_hash>' WHERE username = 'admin';
