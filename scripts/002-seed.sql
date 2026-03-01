-- ============================================
-- حنا لازن - بيانات تجريبية كاملة
-- Run AFTER 001-schema.sql
-- Password for all users: "password123"
-- Bcrypt hash: $2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe
-- ============================================

-- ============================================
-- 1. USERS (1 Admin + 3 Readers + 10 Students)
-- ============================================

-- Admin
INSERT INTO users (id, name, email, password_hash, role, bio, is_active, is_verified, preferred_language) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'أحمد المدير', 'admin@hanalazan.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'admin', 'مدير النظام', true, true, 'ar');

-- Readers
INSERT INTO users (id, name, email, password_hash, role, phone, bio, is_active, is_verified, avatar_url) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'الشيخ عبدالله محمد', 'abdullah@hanalazan.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'reader', '+966501234567', 'قارئ ومجاز برواية حفص عن عاصم، خبرة 15 سنة في تعليم القرآن الكريم', true, true, '/avatars/abdullah.jpg'),
  ('b0000000-0000-0000-0000-000000000002', 'الشيخ محمد حسن', 'muhammad@hanalazan.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'reader', '+966507654321', 'متخصص في أحكام التجويد، حاصل على إجازة في القراءات العشر', true, true, '/avatars/muhammad.jpg'),
  ('b0000000-0000-0000-0000-000000000003', 'الشيخة مريم أحمد', 'maryam@hanalazan.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'reader', '+966509876543', 'معلمة قرآن كريم للإناث، خبرة 10 سنوات، متخصصة في تحفيظ القرآن', true, true, '/avatars/maryam.jpg');

-- Students
INSERT INTO users (id, name, email, password_hash, role, phone, is_active, is_verified, avatar_url) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'أحمد محمد علي', 'ahmed@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966551234567', true, true, '/avatars/student1.jpg'),
  ('c0000000-0000-0000-0000-000000000002', 'فاطمة علي سعيد', 'fatma@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966557654321', true, true, '/avatars/student2.jpg'),
  ('c0000000-0000-0000-0000-000000000003', 'عمر خالد يوسف', 'omar@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966559876543', true, true, '/avatars/student3.jpg'),
  ('c0000000-0000-0000-0000-000000000004', 'نورا سعيد حسن', 'noura@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966551112233', false, true, '/avatars/student4.jpg'),
  ('c0000000-0000-0000-0000-000000000005', 'يوسف حسن أحمد', 'yousef@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966553334455', true, true, '/avatars/student5.jpg'),
  ('c0000000-0000-0000-0000-000000000006', 'سارة محمود', 'sarah@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966555556666', true, true, '/avatars/student6.jpg'),
  ('c0000000-0000-0000-0000-000000000007', 'علي عبدالله', 'ali@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966557778888', true, false, NULL),
  ('c0000000-0000-0000-0000-000000000008', 'ليلى أحمد', 'laila@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966559990000', true, true, '/avatars/student8.jpg'),
  ('c0000000-0000-0000-0000-000000000009', 'خالد يوسف', 'khaled@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', NULL, true, true, NULL),
  ('c0000000-0000-0000-0000-000000000010', 'منى سالم', 'mona@example.com', '$2b$10$xJ3YzR8r6X.tN6oZfJm3LOcDmWV5j0VhQ1u3DsDmXB2jS9yjx.uTe', 'student', '+966552223344', true, true, '/avatars/student10.jpg');

-- ============================================
-- 2. READER PROFILES
-- ============================================

INSERT INTO reader_profiles (user_id, specialization, ijazah_details, certifications, years_of_experience, rating, total_reviews, total_sessions_completed, total_recitations_reviewed, is_accepting_students, teaching_methods, about_me) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'حفص عن عاصم', 'إجازة برواية حفص عن عاصم من الشيخ أحمد الحذيفي', ARRAY['إجازة في القراءات العشر', 'دبلوم في التجويد'], 15, 4.90, 145, 89, 234, true, ARRAY['التلقين المباشر', 'التصحيح التفصيلي', 'المراجعة الدورية'], 'قارئ ومجاز برواية حفص عن عاصم، خبرة 15 سنة في تعليم القرآن الكريم وأحكام التجويد'),
  ('b0000000-0000-0000-0000-000000000002', 'أحكام التجويد', 'إجازة في القراءات العشر من الشيخ عبدالباسط عبدالصمد', ARRAY['ماجستير في علوم القرآن', 'إجازة في القراءات'], 12, 4.75, 98, 56, 178, true, ARRAY['التجويد التطبيقي', 'شرح الأحكام', 'التدريب المكثف'], 'متخصص في أحكام التجويد والقراءات، حاصل على إجازة في القراءات العشر'),
  ('b0000000-0000-0000-0000-000000000003', 'تحفيظ القرآن الكريم', 'إجازة في رواية قالون عن نافع', ARRAY['دبلوم في تحفيظ القرآن', 'دورة في طرق التدريس'], 10, 4.85, 76, 45, 156, true, ARRAY['التحفيظ التدريجي', 'المراجعة المستمرة', 'التشجيع والتحفيز'], 'معلمة قرآن كريم للإناث، خبرة 10 سنوات في التحفيظ والمراجعة');

-- ============================================
-- 3. AVAILABILITY SLOTS
-- ============================================

INSERT INTO availability_slots (reader_id, day_of_week, start_time, end_time, slot_duration_minutes, is_recurring) VALUES
  -- الشيخ عبدالله (الأحد والثلاثاء والخميس)
  ('b0000000-0000-0000-0000-000000000001', 0, '09:00', '12:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 0, '16:00', '20:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 2, '14:00', '18:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 4, '09:00', '13:00', 30, true),
  ('b0000000-0000-0000-0000-000000000001', 4, '18:00', '21:00', 30, true),
  
  -- الشيخ محمد (الاثنين والأربعاء والجمعة)
  ('b0000000-0000-0000-0000-000000000002', 1, '10:00', '14:00', 30, true),
  ('b0000000-0000-0000-0000-000000000002', 1, '17:00', '21:00', 30, true),
  ('b0000000-0000-0000-0000-000000000002', 3, '09:00', '12:00', 30, true),
  ('b0000000-0000-0000-0000-000000000002', 3, '16:00', '20:00', 30, true),
  ('b0000000-0000-0000-0000-000000000002', 5, '14:00', '18:00', 30, true),
  
  -- الشيخة مريم (الأحد والثلاثاء والسبت)
  ('b0000000-0000-0000-0000-000000000003', 0, '08:00', '12:00', 30, true),
  ('b0000000-0000-0000-0000-000000000003', 2, '15:00', '19:00', 30, true),
  ('b0000000-0000-0000-0000-000000000003', 6, '09:00', '13:00', 30, true),
  ('b0000000-0000-0000-0000-000000000003', 6, '16:00', '20:00', 30, true);

-- ============================================
-- 4. RECITATIONS
-- ============================================

INSERT INTO recitations (id, student_id, assigned_reader_id, surah_name, surah_number, ayah_from, ayah_to, audio_url, audio_duration_seconds, file_size_bytes, submission_type, recitation_type, status, student_notes, reviewed_at) VALUES
  -- Approved recitations
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'الفاتحة', 1, 1, 7, '/audio/recitation-1.webm', 95, 1024000, 'recorded', 'tilawa', 'approved', 'أول تلاوة لي', NOW() - INTERVAL '2 days'),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'الإخلاص', 112, 1, 4, '/audio/recitation-2.webm', 45, 512000, 'uploaded', 'hifd', 'approved', 'حفظ جديد', NOW() - INTERVAL '1 day'),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'الناس', 114, 1, 6, '/audio/recitation-3.webm', 60, 768000, 'recorded', 'tilawa', 'approved', NULL, NOW() - INTERVAL '3 days'),
  
  -- In review
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'البقرة', 2, 1, 5, '/audio/recitation-4.webm', 180, 2048000, 'recorded', 'tajweed', 'in_review', 'أرجو التركيز على أحكام النون الساكنة', NULL),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'آل عمران', 3, 1, 10, '/audio/recitation-5.webm', 240, 2560000, 'uploaded', 'muraja3a', 'in_review', NULL, NULL),
  
  -- Pending
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000007', NULL, 'الكهف', 18, 1, 10, '/audio/recitation-6.webm', 300, 3072000, 'recorded', 'tilawa', 'pending', 'تلاوة بطيئة للحفظ', NULL),
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000008', NULL, 'يس', 36, 1, 12, '/audio/recitation-7.webm', 280, 2900000, 'recorded', 'hifd', 'pending', NULL, NULL),
  ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000009', NULL, 'الملك', 67, 1, 15, '/audio/recitation-8.webm', 320, 3200000, 'uploaded', 'tilawa', 'pending', NULL, NULL),
  
  -- Needs work
  ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'الرحمن', 55, 1, 20, '/audio/recitation-9.webm', 400, 4096000, 'recorded', 'tajweed', 'needs_work', NULL, NOW() - INTERVAL '4 hours'),
  ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'الواقعة', 56, 1, 25, '/audio/recitation-10.webm', 500, 5120000, 'uploaded', 'hifd', 'needs_work', 'أحتاج مساعدة في الحفظ', NOW() - INTERVAL '6 hours');

-- ============================================
-- 5. REVIEWS
-- ============================================

INSERT INTO reviews (recitation_id, reader_id, tajweed_score, pronunciation_score, fluency_score, memorization_score, overall_score, strengths, areas_for_improvement, detailed_feedback, verdict, review_duration_minutes) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 9, 9, 8, 9, 8.75, 'أداء ممتاز، مخارج الحروف واضحة', 'التركيز على المدود', 'ما شاء الله تبارك الله، أداء متميز. استمر على هذا المستوى واهتم بالمدود قليلاً', 'mastered', 15),
  ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 10, 10, 9, 10, 9.75, 'حفظ متقن، أداء رائع', NULL, 'بارك الله فيك، حفظ ممتاز وأداء متقن', 'mastered', 10),
  ('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 8, 9, 8, 8, 8.25, 'تلاوة جيدة بشكل عام', 'بعض أحكام الإدغام', 'تلاوة جيدة، مع ضرورة مراجعة أحكام الإدغام', 'mastered', 12),
  ('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000003', 6, 7, 6, 5, 6.00, 'جهد مشكور', 'أحكام المد، الإدغام، الإخفاء', 'يحتاج إلى مراجعة الأحكام الأساسية. أنصح بحجز جلسة للتوضيح', 'needs_session', 20),
  ('d0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 5, 6, 5, 4, 5.00, 'محاولة جيدة', 'الحفظ والتجويد', 'يحتاج إلى تحسين الحفظ ومراجعة أحكام التجويد الأساسية', 'needs_improvement', 18);

-- ============================================
-- 6. BOOKINGS
-- ============================================

INSERT INTO bookings (id, student_id, reader_id, recitation_id, scheduled_at, duration_minutes, meeting_link, meeting_platform, status, student_notes, reminder_sent_at) VALUES
  -- Upcoming confirmed
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009', NOW() + INTERVAL '1 day', 30, 'https://meet.google.com/abc-defg-hij', 'google_meet', 'confirmed', 'مراجعة تلاوة سورة الرحمن', NOW() - INTERVAL '1 hour'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000010', NOW() + INTERVAL '2 days', 30, 'https://us04web.zoom.us/j/123456789', 'zoom', 'confirmed', 'جلسة تحفيظ', NULL),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NULL, NOW() + INTERVAL '3 days', 30, NULL, 'zoom', 'pending', 'جلسة تجويد عامة', NULL),
  
  -- Completed
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '5 days', 30, 'https://meet.google.com/xyz-uvw-rst', 'google_meet', 'completed', NULL, NOW() - INTERVAL '6 days'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', NULL, NOW() - INTERVAL '3 days', 30, 'https://meet.google.com/mno-pqr-stu', 'google_meet', 'completed', 'جلسة مفيدة جداً', NOW() - INTERVAL '4 days'),
  
  -- Cancelled
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', NULL, NOW() + INTERVAL '1 day', 30, NULL, 'zoom', 'cancelled', NULL, NULL);

-- ============================================
-- 7. READER RATINGS
-- ============================================

INSERT INTO reader_ratings (booking_id, student_id, reader_id, rating, teaching_quality, communication, punctuality, helpfulness, feedback_text, would_recommend) VALUES
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 5, 5, 5, 5, 5, 'ما شاء الله، شرح ممتاز وواضح. جزاه الله خيراً', true),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 5, 5, 4, 5, 5, 'معلمة رائعة، صبورة ومتمكنة', true);

-- ============================================
-- 8. CONVERSATIONS & MESSAGES
-- ============================================

INSERT INTO conversations (id, student_id, reader_id, recitation_id, last_message_at, last_message_preview, unread_count_student, unread_count_reader) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009', NOW() - INTERVAL '2 hours', 'شكراً على المراجعة', 0, 1),
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '1 day', 'متى يمكنني حجز جلسة؟', 1, 0),
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', NULL, NOW() - INTERVAL '3 days', 'بارك الله فيكم', 0, 0);

INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, message_type, is_read, created_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'السلام عليكم، تم مراجعة تلاوتك لسورة الرحمن', 'text', true, NOW() - INTERVAL '4 hours'),
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'وعليكم السلام ورحمة الله، شكراً جزيلاً', 'text', true, NOW() - INTERVAL '3 hours'),
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'هل يمكن حجز جلسة لمراجعة الملاحظات؟', 'text', false, NOW() - INTERVAL '2 hours'),
  
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'السلام عليكم، متى يمكنني حجز جلسة؟', 'text', false, NOW() - INTERVAL '1 day'),
  
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'بارك الله فيكم على الجلسة المفيدة', 'text', true, NOW() - INTERVAL '3 days'),
  ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002', 'وفيك بارك الله، سعدت بتدريسك', 'text', true, NOW() - INTERVAL '3 days');

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================

INSERT INTO notifications (user_id, type, title, message, action_url, priority, category, is_read, related_recitation_id, related_booking_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'review_completed', 'تمت مراجعة تلاوتك', 'تم مراجعة تلاوتك لسورة الفاتحة - التقييم: ممتاز', '/student/recitations/d0000000-0000-0000-0000-000000000001', 'normal', 'review', true, 'd0000000-0000-0000-0000-000000000001', NULL),
  ('c0000000-0000-0000-0000-000000000001', 'booking_confirmed', 'تم تأكيد حجز الجلسة', 'تم تأكيد جلستك مع الشيخ عبدالله غداً الساعة 9 صباحاً', '/student/sessions', 'high', 'booking', false, NULL, 'e0000000-0000-0000-0000-000000000001'),
  
  ('c0000000-0000-0000-0000-000000000002', 'recitation_approved', 'تم قبول تلاوتك', 'ما شاء الله! تم قبول تلاوتك لسورة الإخلاص', '/student/recitations/d0000000-0000-0000-0000-000000000002', 'normal', 'recitation', true, 'd0000000-0000-0000-0000-000000000002', NULL),
  
  ('b0000000-0000-0000-0000-000000000001', 'new_recitation', 'تلاوة جديدة بانتظار المراجعة', 'لديك تلاوة جديدة من عمر خالد بانتظار المراجعة', '/reader/recitations/d0000000-0000-0000-0000-000000000004', 'normal', 'recitation', false, 'd0000000-0000-0000-0000-000000000004', NULL),
  ('b0000000-0000-0000-0000-000000000001', 'new_booking', 'حجز جلسة جديد', 'تم حجز جلسة جديدة معك غداً الساعة 9 صباحاً', '/reader/sessions', 'high', 'booking', false, NULL, 'e0000000-0000-0000-0000-000000000001'),
  
  ('b0000000-0000-0000-0000-000000000002', 'new_recitation', 'تلاوات جديدة بانتظار المراجعة', 'لديك 2 تلاوات جديدة بانتظار المراجعة', '/reader/recitations', 'normal', 'recitation', true, NULL, NULL);

-- ============================================
-- 10. STUDENT & READER STATS
-- ============================================

INSERT INTO student_stats (student_id, total_recitations, pending_recitations, approved_recitations, needs_work_recitations, total_sessions_booked, completed_sessions, average_overall_score, current_streak_days, longest_streak_days, last_submission_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 3, 0, 2, 1, 2, 1, 7.38, 3, 7, NOW() - INTERVAL '2 hours'),
  ('c0000000-0000-0000-0000-000000000002', 2, 0, 1, 0, 2, 2, 9.75, 5, 12, NOW() - INTERVAL '1 day'),
  ('c0000000-0000-0000-0000-000000000003', 2, 0, 0, 0, 1, 0, NULL, 2, 4, NOW() - INTERVAL '3 hours'),
  ('c0000000-0000-0000-0000-000000000004', 1, 0, 0, 1, 1, 0, 5.00, 0, 1, NOW() - INTERVAL '6 hours'),
  ('c0000000-0000-0000-0000-000000000005', 1, 0, 1, 0, 1, 1, 8.25, 2, 5, NOW() - INTERVAL '3 days'),
  ('c0000000-0000-0000-0000-000000000006', 1, 0, 0, 0, 1, 0, NULL, 1, 3, NOW() - INTERVAL '2 hours'),
  ('c0000000-0000-0000-0000-000000000007', 1, 1, 0, 0, 0, 0, NULL, 1, 2, NOW() - INTERVAL '1 hour'),
  ('c0000000-0000-0000-0000-000000000008', 1, 1, 0, 0, 0, 0, NULL, 1, 1, NOW() - INTERVAL '30 minutes'),
  ('c0000000-0000-0000-0000-000000000009', 1, 1, 0, 0, 0, 0, NULL, 1, 1, NOW() - INTERVAL '45 minutes'),
  ('c0000000-0000-0000-0000-000000000010', 0, 0, 0, 0, 0, 0, NULL, 0, 0, NULL);

INSERT INTO reader_stats (reader_id, total_reviews_completed, pending_reviews, total_sessions_completed, average_review_time_minutes, average_session_rating, total_students_taught, active_students, this_month_reviews, this_month_sessions, approval_rate, last_review_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 3, 1, 1, 17.67, 5.00, 4, 2, 18, 5, 66.67, NOW() - INTERVAL '4 hours'),
  ('b0000000-0000-0000-0000-000000000002', 2, 1, 2, 10.00, 5.00, 3, 2, 12, 8, 100.00, NOW() - INTERVAL '1 day'),
  ('b0000000-0000-0000-0000-000000000003', 2, 0, 1, 16.00, 5.00, 2, 1, 8, 3, 50.00, NOW() - INTERVAL '4 hours');

-- ============================================
-- 11. SYSTEM SETTINGS
-- ============================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('smtp_config', '{"host": "smtp.gmail.com", "port": 587, "secure": false, "user": "noreply@hanalazan.com", "from_name": "حنا لازن", "from_email": "noreply@hanalazan.com"}', 'email', 'إعدادات SMTP للبريد الإلكتروني', false),
  ('storage_config', '{"provider": "cloudinary", "cloud_name": "hanalazan", "max_file_size_mb": 20, "allowed_formats": ["mp3", "wav", "webm", "m4a"]}', 'storage', 'إعدادات تخزين الملفات', false),
  ('workflow_statuses', '{"pending": true, "in_review": true, "approved": true, "needs_work": true, "needs_session": true, "rejected": true}', 'workflow', 'حالات سير العمل المتاحة', false),
  ('security_settings', '{"2fa_enabled": false, "session_timeout_minutes": 1440, "max_login_attempts": 5, "password_min_length": 8, "require_email_verification": true}', 'security', 'إعدادات الأمان', false),
  ('notification_settings', '{"email_notifications": true, "sms_notifications": false, "push_notifications": false}', 'notification', 'إعدادات الإشعارات', true),
  ('booking_settings', '{"min_booking_notice_hours": 24, "max_advance_booking_days": 30, "allow_cancellation_hours": 24, "default_session_duration_minutes": 30}', 'general', 'إعدادات الحجوزات', true),
  ('site_info', '{"site_name_ar": "حنا لازن", "site_name_en": "Hana Lazan", "support_email": "support@hanalazan.com", "support_phone": "+966500000000"}', 'general', 'معلومات الموقع', true);

-- ============================================
-- 12. EMAIL TEMPLATES
-- ============================================

INSERT INTO email_templates (template_key, template_name_ar, template_name_en, subject_ar, subject_en, body_ar, body_en, variables) VALUES
  ('welcome', 'رسالة الترحيب', 'Welcome Email', 'مرحباً بك في حنا لازن', 'Welcome to Hana Lazan', 'السلام عليكم {{name}}،\n\nمرحباً بك في منصة حنا لازن لتعلم القرآن الكريم. نحن سعداء بانضمامك إلينا.\n\nيمكنك الآن البدء في تسجيل تلاوتك والحصول على مراجعة من قراء متخصصين.\n\nبارك الله فيك', 'Peace be upon you {{name}},\n\nWelcome to Hana Lazan platform for learning Quran. We are happy to have you join us.\n\nYou can now start recording your recitation and get reviews from specialized readers.\n\nMay Allah bless you', '["name", "email"]'),
  
  ('recitation_received', 'تأكيد استلام التلاوة', 'Recitation Received', 'تم استلام تلاوتك', 'Your Recitation Has Been Received', 'السلام عليكم {{name}}،\n\nتم استلام تلاوتك لسورة {{surah}} بنجاح. سيتم مراجعتها قريباً من قبل أحد القراء المتخصصين.\n\nسنرسل لك إشعاراً عند اكتمال المراجعة.\n\nجزاك الله خيراً', 'Peace be upon you {{name}},\n\nYour recitation of Surah {{surah}} has been received successfully. It will be reviewed soon by one of our specialized readers.\n\nWe will notify you when the review is complete.\n\nMay Allah reward you', '["name", "surah", "recitation_url"]'),
  
  ('review_completed', 'اكتمال المراجعة', 'Review Completed', 'تمت مراجعة تلاوتك', 'Your Recitation Has Been Reviewed', 'السلام عليكم {{name}}،\n\nتمت مراجعة تلاوتك لسورة {{surah}}.\n\nالنتيجة: {{verdict}}\nالتقييم الإجمالي: {{overall_score}}/10\n\nيمكنك مراجعة التفاصيل الكاملة من خلال حسابك.\n\n{{feedback}}\n\nبارك الله فيك', 'Peace be upon you {{name}},\n\nYour recitation of Surah {{surah}} has been reviewed.\n\nResult: {{verdict}}\nOverall Score: {{overall_score}}/10\n\nYou can review the full details from your account.\n\n{{feedback}}\n\nMay Allah bless you', '["name", "surah", "verdict", "overall_score", "feedback", "recitation_url"]'),
  
  ('booking_confirmed', 'تأكيد الحجز', 'Booking Confirmed', 'تم تأكيد حجز جلستك', 'Your Session Booking Confirmed', 'السلام عليكم {{name}}،\n\nتم تأكيد حجز جلستك مع {{reader_name}}.\n\nالموعد: {{scheduled_at}}\nالمدة: {{duration}} دقيقة\n\nرابط الاجتماع: {{meeting_link}}\n\nنذكرك بالحضور في الموعد المحدد.\n\nبارك الله فيك', 'Peace be upon you {{name}},\n\nYour session booking with {{reader_name}} has been confirmed.\n\nScheduled: {{scheduled_at}}\nDuration: {{duration}} minutes\n\nMeeting Link: {{meeting_link}}\n\nWe remind you to attend at the scheduled time.\n\nMay Allah bless you', '["name", "reader_name", "scheduled_at", "duration", "meeting_link"]'),
  
  ('session_reminder', 'تذكير بالجلسة', 'Session Reminder', 'تذكير: جلستك خلال ساعة', 'Reminder: Your Session in 1 Hour', 'السلام عليكم {{name}}،\n\nتذكير بأن جلستك مع {{reader_name}} ستبدأ خلال ساعة واحدة.\n\nالموعد: {{scheduled_at}}\nرابط الاجتماع: {{meeting_link}}\n\nنتمنى لك جلسة مفيدة', 'Peace be upon you {{name}},\n\nReminder that your session with {{reader_name}} will start in 1 hour.\n\nScheduled: {{scheduled_at}}\nMeeting Link: {{meeting_link}}\n\nWe wish you a beneficial session', '["name", "reader_name", "scheduled_at", "meeting_link"]'),
  
  ('password_reset', 'إعادة تعيين كلمة المرور', 'Password Reset', 'طلب إعادة تعيين كلمة المرور', 'Password Reset Request', 'السلام عليكم {{name}}،\n\nتلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.\n\nاضغط على الرابط التالي لإعادة التعيين:\n{{reset_link}}\n\nهذا الرابط صالح لمدة ساعة واحدة.\n\nإذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.', 'Peace be upon you {{name}},\n\nWe received a request to reset your password.\n\nClick the following link to reset:\n{{reset_link}}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, you can ignore this message.', '["name", "reset_link"]');

-- ============================================
-- 13. ANNOUNCEMENTS
-- ============================================

INSERT INTO announcements (title_ar, title_en, content_ar, content_en, target_audience, priority, is_published, published_at) VALUES
  ('مرحباً بكم في منصة حنا لازن', 'Welcome to Hana Lazan Platform', 'نرحب بجميع الطلاب والقراء في منصة حنا لازن. نسأل الله أن يبارك في علمكم وعملكم.', 'We welcome all students and readers to Hana Lazan platform. We ask Allah to bless your knowledge and work.', 'all', 'normal', true, NOW() - INTERVAL '7 days'),
  ('تحديثات جديدة على المنصة', 'New Platform Updates', 'تم إضافة ميزات جديدة للمنصة تشمل تحسينات في واجهة المستخدم وإمكانية حجز الجلسات بشكل أسرع.', 'New features have been added to the platform including UI improvements and faster session booking.', 'all', 'high', true, NOW() - INTERVAL '2 days');

-- ============================================
-- ملخص البيانات المُدخلة:
-- - 1 Admin
-- - 3 Readers with profiles
-- - 10 Students
-- - 14 Availability slots
-- - 10 Recitations (متنوعة الحالات)
-- - 5 Reviews
-- - 6 Bookings
-- - 2 Reader ratings
-- - 3 Conversations with 6 messages
-- - 6 Notifications
-- - 10 Student stats
-- - 3 Reader stats
-- - 7 System settings
-- - 6 Email templates
-- - 2 Announcements
-- ============================================
