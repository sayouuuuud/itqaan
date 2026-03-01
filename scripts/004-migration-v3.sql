-- =============================================
-- Migration V3 – Fix Schema Mismatches & Add Missing Features
-- Run AFTER 003-migration-v2.sql
-- Platform: إتقان الفاتحة (Itqaan Al-Fatiha)
-- =============================================

-- 1) إضافة إعدادات مفقودة
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
VALUES
  ('platform_name', '"إتقان الفاتحة"', 'general', 'اسم المنصة', true),
  ('surah_name', '"الفاتحة"', 'general', 'اسم السورة المعتمدة', true)
ON CONFLICT (setting_key) DO NOTHING;

-- 1.5) إضافة حقول استعادة كلمة المرور لجدول users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;

-- 2) تحديث trigger الإشعارات بالرسائل العربية
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
        WHEN NEW.status = 'mastered' THEN 'تهانينا! قراءتك متقنة'
        WHEN NEW.status = 'needs_session' THEN 'تحتاج جلسة تصحيح'
        WHEN NEW.status = 'session_booked' THEN 'تم حجز الموعد'
        ELSE 'تم تحديث حالة طلبك'
      END,
      CASE
        WHEN NEW.status = 'mastered' THEN 'تهانينا 🎉 قراءتك لسورة الفاتحة متقنة. سيتم إشعارك بموعد الحفل الختامي عبر البريد الإلكتروني لاحقاً.'
        WHEN NEW.status = 'needs_session' THEN 'تمت مراجعة قراءتك. تحتاج إلى جلسة تصحيح بسيطة. يمكنك حجز الموعد الآن.'
        ELSE 'تم تحديث حالة طلبك.'
      END,
      'recitation',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_recitation_status_change ON recitations;
CREATE TRIGGER trg_recitation_status_change
  AFTER UPDATE OF status ON recitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_recitation_status_change();

-- 3) إضافة trigger لإرسال إشعار عند إنشاء حجز جديد (للمقرئ)
CREATE OR REPLACE FUNCTION notify_reader_on_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, category, related_booking_id)
  VALUES (
    NEW.reader_id,
    'new_booking',
    'حجز جلسة جديد',
    'تم حجز جلسة جديدة معك. يرجى مراجعة تفاصيل الموعد.',
    'booking',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_new_booking_notify_reader ON bookings;
CREATE TRIGGER trg_new_booking_notify_reader
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_reader_on_new_booking();
