-- Migration: Add activity toggle for recitations
-- Description: Adds a column to the users table to allow readers to toggle their availability for new recitations.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_accepting_recitations BOOLEAN DEFAULT TRUE;

-- Create an index for faster lookup during auto-assignment
CREATE INDEX IF NOT EXISTS idx_users_is_accepting_recitations ON users(is_accepting_recitations) WHERE role = 'reader';

-- Log existing readers' status
INSERT INTO activity_logs (action, entity_type, description)
VALUES ('migration_v9', 'system', 'Added is_accepting_recitations column to users table');
