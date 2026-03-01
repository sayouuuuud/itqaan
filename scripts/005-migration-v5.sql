-- =============================================
-- Migration V5 – Admin Dashboard Backend Wiring
-- Run AFTER 004-migration-v3.sql
-- Itqaan Al-Fatiha Platform
-- =============================================

-- 1) Add reader-specific columns to users table (denormalized for easier queries)
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS memorized_parts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name_triple VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'auto_approved'
  CHECK (approval_status IN ('auto_approved', 'pending_approval', 'approved', 'rejected'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- 2) Sync existing reader profile data into users table
UPDATE users u
SET
  city = COALESCE(u.city, rp.city),
  qualification = COALESCE(u.qualification, rp.qualification),
  memorized_parts = COALESCE(u.memorized_parts, rp.memorized_parts),
  years_of_experience = COALESCE(u.years_of_experience, rp.years_of_experience),
  full_name_triple = COALESCE(u.full_name_triple, rp.full_name_triple),
  phone = COALESCE(u.phone, rp.phone)
FROM reader_profiles rp
WHERE rp.user_id = u.id;

-- 3) Add missing system_settings for new admin toggles
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES
  ('show_certificate_section', 'true', 'general', 'Show/hide certificate section for mastered students', true),
  ('show_years_of_experience', 'true', 'general', 'Show years of experience field in reader registration', false),
  ('reader_attachment_required', 'false', 'general', 'Require reader certificate attachment on registration', false),
  ('certificate_pdf_required', 'false', 'general', 'Require student to upload certificate PDF', false),
  ('resend_email_on_result_update', 'true', 'notification', 'Resend email to student when admin updates result', false),
  ('max_daily_sessions_per_reader', '5', 'general', 'Max daily sessions per reader', false),
  ('smtp_host', '"smtp.gmail.com"', 'email', 'SMTP server hostname', false),
  ('smtp_port', '"587"', 'email', 'SMTP server port', false),
  ('smtp_user', '""', 'email', 'SMTP username/email', false),
  ('smtp_pass', '""', 'email', 'SMTP password (encrypted in production)', false),
  ('smtp_tls', 'true', 'email', 'Use TLS for SMTP', false),
  ('storage_provider', '"cloudinary"', 'storage', 'File storage provider', false),
  ('cloud_name', '""', 'storage', 'Cloudinary cloud name', false),
  ('cloud_api_key', '""', 'storage', 'Cloudinary API key', false),
  ('max_file_size_mb', '20', 'storage', 'Maximum file upload size in MB', false),
  ('two_factor_auth', 'false', 'security', 'Enable two-factor auth for all users', false),
  ('activity_logging', 'true', 'security', 'Enable activity logging', false),
  ('limit_login_attempts', 'true', 'security', 'Lock account after 5 failed login attempts', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 4) Add activity log helper function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_description TEXT,
  p_status VARCHAR DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, status)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_description, p_status)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger to auto log user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (
      NEW.id,
      CASE WHEN NEW.is_active THEN 'user_activated' ELSE 'user_deactivated' END,
      'user',
      NEW.id,
      CASE WHEN NEW.is_active THEN 'User account activated' ELSE 'User account deactivated' END
    );
  END IF;
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status
     AND NEW.approval_status IN ('approved', 'rejected') THEN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description)
    VALUES (
      NEW.id,
      'reader_' || NEW.approval_status,
      'reader',
      NEW.id,
      'Reader application ' || NEW.approval_status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_user_status ON users;
CREATE TRIGGER trg_log_user_status
  AFTER UPDATE OF is_active, approval_status ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_status_change();

-- 6) Trigger to log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_logs (action, entity_type, entity_id, description)
    VALUES (
      'booking_' || NEW.status,
      'booking',
      NEW.id,
      'Booking status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_booking_status ON bookings;
CREATE TRIGGER trg_log_booking_status
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION log_booking_status_change();

-- 7) Trigger to log recitation assignments
CREATE OR REPLACE FUNCTION log_recitation_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.assigned_reader_id IS DISTINCT FROM NEW.assigned_reader_id AND NEW.assigned_reader_id IS NOT NULL THEN
    INSERT INTO activity_logs (action, entity_type, entity_id, description)
    VALUES (
      'recitation_assigned',
      'recitation',
      NEW.id,
      'Recitation assigned to reader'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_recitation_assignment ON recitations;
CREATE TRIGGER trg_log_recitation_assignment
  AFTER UPDATE OF assigned_reader_id ON recitations
  FOR EACH ROW
  EXECUTE FUNCTION log_recitation_assignment();

-- 8) Create index for faster settings lookup
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_announcements_audience ON announcements(target_audience, is_published);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
