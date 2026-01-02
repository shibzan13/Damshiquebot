-- Migration: Add username and password_hash to user_registration_requests
-- Date: 2026-01-02

ALTER TABLE user_registration_requests 
ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(64);
