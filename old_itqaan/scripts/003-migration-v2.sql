-- =============================================
-- Migration V2 – Itqaan Al-Fatiha Platform Updates
-- Run AFTER 001-schema.sql and 002-seed.sql
-- =============================================

-- 1) Add gender field to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female'));

-- 2) Add reader approval status field
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'auto_approved'
  CHECK (approval_status IN ('auto_approved', 'pending_approval', 'approved', 'rejected'));

-- 2.1) Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 3) Update reader_profiles with new fields
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS full_name_triple VARCHAR(255);
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS memorized_parts INTEGER DEFAULT 0;
ALTER TABLE reader_profiles ADD COLUMN IF NOT EXISTS certificate_file_url TEXT;

-- 4) Update recitation statuses (replace old: approved/needs_work with new: mastered/session_booked)
ALTER TABLE recitations DROP CONSTRAINT IF EXISTS recitations_status_check;

-- Migrate existing data from old statuses to new
UPDATE recitations SET status = 'mastered' WHERE status = 'approved';
UPDATE recitations SET status = 'needs_session' WHERE status = 'needs_work';

ALTER TABLE recitations ADD CONSTRAINT recitations_status_check
  CHECK (status IN ('pending', 'in_review', 'mastered', 'needs_session', 'session_booked', 'rejected'));

-- 5) Add slot_start / slot_end columns to bookings
--    The original schema uses scheduled_at + duration_minutes + end_time.
--    The new code uses slot_start / slot_end for clarity.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_start TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_end TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate existing booking data from scheduled_at to slot_start/slot_end
UPDATE bookings SET
  slot_start = scheduled_at,
  slot_end = COALESCE(end_time, scheduled_at + (duration_minutes || ' minutes')::interval)
WHERE slot_start IS NULL AND scheduled_at IS NOT NULL;

-- Index for slot-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_slot_start ON bookings(slot_start);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_range ON bookings(reader_id, slot_start, slot_end) WHERE status IN ('pending', 'confirmed');

-- 6) Booking comments table
CREATE TABLE IF NOT EXISTS booking_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_booking_comments_booking ON booking_comments(booking_id, created_at);

-- 7) Certificate data table
CREATE TABLE IF NOT EXISTS certificate_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  university VARCHAR(255),
  college VARCHAR(255),
  city VARCHAR(100),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
  pdf_file_url TEXT,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) New system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES
  ('certificate_section_enabled', 'false', 'general', 'Enable/hide certificate section', true),
  ('certificate_data_required', 'false', 'general', 'Is certificate data completion mandatory', false),
  ('reader_certificate_field_visible', 'true', 'general', 'Show/hide reader qualification upload field', false),
  ('reader_experience_field_visible', 'true', 'general', 'Show/hide reader experience years field', false),
  ('reader_certificate_required', 'false', 'general', 'Is reader attachment upload mandatory', false),
  ('default_session_duration', '30', 'general', 'Default session duration in minutes', false),
  ('max_sessions_per_reader_daily', '10', 'general', 'Max daily sessions per reader', false),
  ('resend_email_on_result_change', 'true', 'notification', 'Resend email on result change', false),
  ('recording_max_seconds', '180', 'general', 'Max recording duration in seconds', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 9) Update reviews verdict constraint to match new statuses
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_verdict_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_verdict_check
  CHECK (verdict IN ('mastered', 'needs_session', 'needs_improvement', 're_record'));

-- 10) Trigger for recitation status change notifications
CREATE OR REPLACE FUNCTION notify_on_recitation_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, title, message, category, related_recitation_id)
    VALUES (
      NEW.student_id,
      CASE
        WHEN NEW.status = 'mastered' THEN 'mastered'
        WHEN NEW.status = 'needs_session' THEN 'needs_session'
        WHEN NEW.status = 'session_booked' THEN 'session_booked'
        ELSE 'status_change'
      END,
      CASE
        WHEN NEW.status = 'mastered' THEN 'Congratulations! Your recitation is mastered'
        WHEN NEW.status = 'needs_session' THEN 'You need a correction session'
        WHEN NEW.status = 'session_booked' THEN 'Your appointment is booked'
        ELSE 'Your request status has been updated'
      END,
      CASE
        WHEN NEW.status = 'mastered' THEN 'Congratulations! Your recitation of Surah Al-Fatiha is mastered. You will be notified of the closing ceremony later.'
        WHEN NEW.status = 'needs_session' THEN 'Your recitation has been reviewed. You need a simple correction session. You can book an appointment now.'
        ELSE 'Your request status has been updated.'
      END,
      'recitation',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recitation_status_change ON recitations;
CREATE TRIGGER trg_recitation_status_change
  AFTER UPDATE OF status ON recitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_recitation_status_change();
