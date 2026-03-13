-- Migration: Fix default approval status for readers
-- Description: Change the default approval status from 'auto_approved' to 'pending_approval' to ensure manual review.

ALTER TABLE users ALTER COLUMN approval_status SET DEFAULT 'pending_approval';

-- Update any existing 'auto_approved' users that might still be pending
-- UPDATE users SET approval_status = 'pending_approval' WHERE approval_status = 'auto_approved' AND role = 'reader';
