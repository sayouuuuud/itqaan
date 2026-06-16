-- Migration 012: Initiative invite/join codes
-- Adds a unique join_code and a join_enabled flag to initiatives so that
-- initiative admins can share invite links and students can self-enroll.

ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS join_code varchar(12) UNIQUE;
ALTER TABLE initiatives ADD COLUMN IF NOT EXISTS join_enabled boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_initiatives_join_code ON initiatives(join_code);
