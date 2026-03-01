-- ============================================
-- حنا لازن - قاعدة البيانات الكاملة
-- PostgreSQL Complete Database Schema
-- Version: 1.0 - Production Ready
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. USERS & AUTHENTICATION (3 جداول)
-- ============================================

-- المستخدمين الأساسي
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'reader', 'admin')),
  phone VARCHAR(20),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_password_token TEXT,
  reset_password_expires TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh tokens للـJWT
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions للـactive sessions tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. READER PROFILES (1 جدول)
-- ============================================

CREATE TABLE reader_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(100),
  ijazah_details TEXT,
  certifications TEXT[],
  years_of_experience INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_sessions_completed INTEGER DEFAULT 0,
  total_recitations_reviewed INTEGER DEFAULT 0,
  hourly_rate DECIMAL(10,2) DEFAULT 0.00,
  is_accepting_students BOOLEAN DEFAULT true,
  max_students_per_week INTEGER DEFAULT 20,
  preferred_languages TEXT[] DEFAULT ARRAY['ar'],
  teaching_methods TEXT[],
  about_me TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. AVAILABILITY & SCHEDULING (2 جداول)
-- ============================================

-- مواعيد القراء المتاحة
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE,
  is_available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- الإجازات والعطلات
CREATE TABLE reader_time_off (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- ============================================
-- 4. RECITATIONS (1 جدول)
-- ============================================

CREATE TABLE recitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_reader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  surah_name VARCHAR(100) NOT NULL DEFAULT 'الإخلاص',
  surah_number INTEGER,
  ayah_from INTEGER,
  ayah_to INTEGER,
  audio_url TEXT NOT NULL,
  audio_duration_seconds INTEGER,
  file_size_bytes BIGINT,
  submission_type VARCHAR(20) DEFAULT 'recorded' CHECK (submission_type IN ('recorded', 'uploaded')),
  recitation_type VARCHAR(30) DEFAULT 'tilawa' CHECK (recitation_type IN ('tilawa', 'hifd', 'tajweed', 'muraja3a')),
  qiraah VARCHAR(50) DEFAULT 'حفص عن عاصم',
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'needs_work', 'needs_session', 'rejected')),
  priority INTEGER DEFAULT 0,
  student_notes TEXT,
  internal_notes TEXT,
  assigned_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. BOOKINGS & SESSIONS (1 جدول)
-- ============================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  
  -- معلومات الموعد
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  end_time TIMESTAMPTZ,
  
  -- معلومات الجلسة
  meeting_link TEXT,
  meeting_platform VARCHAR(50) DEFAULT 'zoom',
  meeting_password TEXT,
  meeting_id VARCHAR(100),
  
  -- الحالة
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled')),
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  rescheduled_from UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- ملاحظات
  student_notes TEXT,
  reader_notes TEXT,
  session_summary TEXT,
  
  -- التتبع
  reminder_sent_at TIMESTAMPTZ,
  student_joined_at TIMESTAMPTZ,
  reader_joined_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. REVIEWS & FEEDBACK (2 جداول)
-- ============================================

-- مراجعات القراء للتلاوات
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recitation_id UUID NOT NULL UNIQUE REFERENCES recitations(id) ON DELETE CASCADE,
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- التقييمات (من 10)
  tajweed_score INTEGER CHECK (tajweed_score >= 0 AND tajweed_score <= 10),
  pronunciation_score INTEGER CHECK (pronunciation_score >= 0 AND pronunciation_score <= 10),
  fluency_score INTEGER CHECK (fluency_score >= 0 AND fluency_score <= 10),
  memorization_score INTEGER CHECK (memorization_score >= 0 AND memorization_score <= 10),
  overall_score DECIMAL(4,2),
  
  -- الملاحظات
  strengths TEXT,
  areas_for_improvement TEXT,
  detailed_feedback TEXT,
  recommendation TEXT,
  verdict VARCHAR(30) NOT NULL CHECK (verdict IN ('mastered', 'needs_session', 'needs_improvement', 're_record')),
  
  -- معلومات إضافية
  error_markers JSONB DEFAULT '[]',
  review_duration_minutes INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تقييمات الطلاب للقراء بعد الجلسات
CREATE TABLE reader_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  teaching_quality INTEGER CHECK (teaching_quality >= 1 AND teaching_quality <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  punctuality INTEGER CHECK (punctuality >= 1 AND punctuality <= 5),
  helpfulness INTEGER CHECK (helpfulness >= 1 AND helpfulness <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. MESSAGES & CHAT (2 جداول)
-- ============================================

-- المحادثات
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_student INTEGER DEFAULT 0,
  unread_count_reader INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, reader_id)
);

-- الرسائل
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'link', 'file', 'audio', 'system')),
  attachment_url TEXT,
  attachment_type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. NOTIFICATIONS (1 جدول)
-- ============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category VARCHAR(30) CHECK (category IN ('recitation', 'booking', 'review', 'system', 'message')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  sent_via_email BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  related_recitation_id UUID REFERENCES recitations(id) ON DELETE SET NULL,
  related_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. STATISTICS & ANALYTICS (2 جداول)
-- ============================================

-- إحصائيات الطلاب
CREATE TABLE student_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_recitations INTEGER DEFAULT 0,
  pending_recitations INTEGER DEFAULT 0,
  approved_recitations INTEGER DEFAULT 0,
  needs_work_recitations INTEGER DEFAULT 0,
  needs_session_recitations INTEGER DEFAULT 0,
  rejected_recitations INTEGER DEFAULT 0,
  total_sessions_booked INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  cancelled_sessions INTEGER DEFAULT 0,
  no_show_sessions INTEGER DEFAULT 0,
  total_hours_studied DECIMAL(10,2) DEFAULT 0.00,
  average_tajweed_score DECIMAL(4,2),
  average_pronunciation_score DECIMAL(4,2),
  average_overall_score DECIMAL(4,2),
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_submission_at TIMESTAMPTZ,
  last_session_at TIMESTAMPTZ,
  total_messages_sent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إحصائيات القراء
CREATE TABLE reader_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reader_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_reviews_completed INTEGER DEFAULT 0,
  pending_reviews INTEGER DEFAULT 0,
  total_sessions_completed INTEGER DEFAULT 0,
  total_sessions_booked INTEGER DEFAULT 0,
  cancelled_sessions INTEGER DEFAULT 0,
  no_show_sessions INTEGER DEFAULT 0,
  average_review_time_minutes DECIMAL(10,2),
  average_session_rating DECIMAL(3,2),
  total_students_taught INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  this_month_reviews INTEGER DEFAULT 0,
  this_month_sessions INTEGER DEFAULT 0,
  this_week_hours DECIMAL(10,2) DEFAULT 0.00,
  response_time_avg_minutes DECIMAL(10,2),
  approval_rate DECIMAL(5,2),
  last_review_at TIMESTAMPTZ,
  last_session_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ACTIVITY LOGS (1 جدول)
-- ============================================

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  description TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. SYSTEM SETTINGS & CONFIG (2 جداول)
-- ============================================

CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(50) NOT NULL CHECK (setting_type IN ('email', 'storage', 'workflow', 'security', 'general', 'payment', 'notification')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_editable BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_key VARCHAR(100) NOT NULL UNIQUE,
  template_name_ar VARCHAR(255) NOT NULL,
  template_name_en VARCHAR(255) NOT NULL,
  subject_ar VARCHAR(255) NOT NULL,
  subject_en VARCHAR(255) NOT NULL,
  body_ar TEXT NOT NULL,
  body_en TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. ANNOUNCEMENTS (1 جدول)
-- ============================================

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  target_audience VARCHAR(20) NOT NULL CHECK (target_audience IN ('all', 'students', 'readers', 'admins')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. REPORTS & EXPORTS (1 جدول)
-- ============================================

CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL,
  filters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  row_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES للأداء
-- ============================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created ON users(created_at DESC);

-- Recitations
CREATE INDEX idx_recitations_student ON recitations(student_id);
CREATE INDEX idx_recitations_reader ON recitations(assigned_reader_id);
CREATE INDEX idx_recitations_status ON recitations(status);
CREATE INDEX idx_recitations_created ON recitations(created_at DESC);
CREATE INDEX idx_recitations_pending ON recitations(status) WHERE status = 'pending';
CREATE INDEX idx_recitations_in_review ON recitations(assigned_reader_id, status) WHERE status = 'in_review';

-- Reviews
CREATE INDEX idx_reviews_recitation ON reviews(recitation_id);
CREATE INDEX idx_reviews_reader ON reviews(reader_id);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- Bookings
CREATE INDEX idx_bookings_student ON bookings(student_id);
CREATE INDEX idx_bookings_reader ON bookings(reader_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_upcoming ON bookings(reader_id, scheduled_at) WHERE status IN ('pending', 'confirmed');

-- Availability
CREATE INDEX idx_availability_reader ON availability_slots(reader_id);
CREATE INDEX idx_availability_day ON availability_slots(day_of_week);
CREATE INDEX idx_availability_active ON availability_slots(reader_id, is_available) WHERE is_available = true;

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- Conversations
CREATE INDEX idx_conversations_student ON conversations(student_id, last_message_at DESC);
CREATE INDEX idx_conversations_reader ON conversations(reader_id, last_message_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON notifications(type);

-- Activity Logs
CREATE INDEX idx_activity_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- Sessions
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق على كل الجداول
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reader_profiles_updated_at BEFORE UPDATE ON reader_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recitations_updated_at BEFORE UPDATE ON recitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger لتحديث conversation عند إضافة رسالة جديدة
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.message_text, 100),
    unread_count_student = CASE WHEN NEW.recipient_id = (SELECT student_id FROM conversations WHERE id = NEW.conversation_id) THEN unread_count_student + 1 ELSE unread_count_student END,
    unread_count_reader = CASE WHEN NEW.recipient_id = (SELECT reader_id FROM conversations WHERE id = NEW.conversation_id) THEN unread_count_reader + 1 ELSE unread_count_reader END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message 
  AFTER INSERT ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- VIEWS للاستعلامات الشائعة
-- ============================================

-- القراء النشطين
CREATE VIEW active_readers AS
SELECT 
  u.id, u.name, u.email, u.avatar_url, u.bio, u.phone,
  rp.specialization, rp.ijazah_details, rp.years_of_experience,
  rp.rating, rp.total_reviews, rp.total_sessions_completed,
  rp.is_accepting_students, rp.hourly_rate
FROM users u
INNER JOIN reader_profiles rp ON u.id = rp.user_id
WHERE u.is_active = true AND u.role = 'reader' AND rp.is_accepting_students = true;

-- التلاوات الكاملة مع المعلومات
CREATE VIEW recitations_full AS
SELECT 
  r.id, r.surah_name, r.audio_url, r.status, r.created_at, r.reviewed_at,
  s.id as student_id, s.name as student_name, s.email as student_email, s.avatar_url as student_avatar,
  rd.id as reader_id, rd.name as reader_name, rd.email as reader_email, rd.avatar_url as reader_avatar,
  rev.overall_score, rev.verdict, rev.detailed_feedback
FROM recitations r
INNER JOIN users s ON r.student_id = s.id
LEFT JOIN users rd ON r.assigned_reader_id = rd.id
LEFT JOIN reviews rev ON r.id = rev.recitation_id;

-- الجلسات القادمة
CREATE VIEW upcoming_sessions AS
SELECT 
  b.id, b.scheduled_at, b.duration_minutes, b.meeting_link, b.status,
  s.id as student_id, s.name as student_name, s.avatar_url as student_avatar,
  r.id as reader_id, r.name as reader_name, r.avatar_url as reader_avatar
FROM bookings b
INNER JOIN users s ON b.student_id = s.id
INNER JOIN users r ON b.reader_id = r.id
WHERE b.status IN ('pending', 'confirmed') 
  AND b.scheduled_at > NOW()
ORDER BY b.scheduled_at ASC;

-- ============================================
-- TRIGGERS FOR AUTO-CALCULATIONS
-- ============================================

-- Function to calculate booking end_time
CREATE OR REPLACE FUNCTION calculate_booking_end_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.end_time := NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate end_time on bookings
CREATE TRIGGER set_booking_end_time
  BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_booking_end_time();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'المستخدمين - طلاب وقراء ومشرفين';
COMMENT ON TABLE recitations IS 'التلاوات المسجلة من الطلاب';
COMMENT ON TABLE reviews IS 'مراجعات وتقييمات القراء';
COMMENT ON TABLE bookings IS 'حجوزات الجلسات';
COMMENT ON TABLE messages IS 'رسائل المحادثات';
COMMENT ON TABLE notifications IS 'إشعارات النظام';
COMMENT ON TABLE student_stats IS 'إحصائيات الطلاب';
COMMENT ON TABLE reader_stats IS 'إحصائيات القراء';
COMMENT ON TABLE activity_logs IS 'سجل الأنشطة والتدقيق';

-- ============================================
-- TOTAL: 20 جدول + 3 views
-- ============================================
