-- Migration: Add identity provider support (Privy + Telegram)
-- This migration adds invisible authentication layer fields

-- Add identity anchor columns
ALTER TABLE users ADD COLUMN privy_user_id TEXT;
ALTER TABLE users ADD COLUMN telegram_user_id TEXT;

-- Create indexes for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_privy_id ON users(privy_user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_user_id);

-- Make email and passwordHash nullable for new auth flows
-- (Existing records will keep their values)
-- SQLite doesn't support ALTER COLUMN directly, so we note this for application logic:
-- New users via auth provider don't need email/passwordHash
-- Legacy users keep their email/passwordHash for backward compatibility
