-- =====================================================
-- Supabase Row Level Security (RLS) Configuration
-- =====================================================
-- نسخة معدلة - تتعامل مع أنواع البيانات المختلفة
-- =====================================================

-- =====================================================
-- 1. PUBLIC/READ-ONLY TABLES (جداول القراءة العامة)
-- =====================================================

-- -------------------- quran_verses --------------------
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quran_verses_public_read" ON public.quran_verses;
CREATE POLICY "quran_verses_public_read" ON public.quran_verses
    FOR SELECT
    TO public
    USING (true);

-- -------------------- tags --------------------
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tags_public_read" ON public.tags;
CREATE POLICY "tags_public_read" ON public.tags
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "tags_authenticated_all" ON public.tags;
CREATE POLICY "tags_authenticated_all" ON public.tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- navbar_items --------------------
ALTER TABLE public.navbar_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "navbar_items_public_read" ON public.navbar_items;
CREATE POLICY "navbar_items_public_read" ON public.navbar_items
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "navbar_items_authenticated_all" ON public.navbar_items;
CREATE POLICY "navbar_items_authenticated_all" ON public.navbar_items
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- site_settings --------------------
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "site_settings_authenticated_all" ON public.site_settings;
CREATE POLICY "site_settings_authenticated_all" ON public.site_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- hero_settings --------------------
ALTER TABLE public.hero_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hero_settings_public_read" ON public.hero_settings;
CREATE POLICY "hero_settings_public_read" ON public.hero_settings
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "hero_settings_authenticated_all" ON public.hero_settings;
CREATE POLICY "hero_settings_authenticated_all" ON public.hero_settings
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 2. USER-OWNED TABLES (جداول البيانات الشخصية)
-- =====================================================
-- ملاحظة: تم تبسيط الـ Policies لتجنب مشاكل casting

-- -------------------- users --------------------
-- قراءة عامة للمصادقين، تعديل للمصادقين
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_authenticated_read" ON public.users;
CREATE POLICY "users_authenticated_read" ON public.users
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "users_authenticated_all" ON public.users;
CREATE POLICY "users_authenticated_all" ON public.users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- user_preferences --------------------
-- للمصادقين فقط
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_authenticated_all" ON public.user_preferences;
CREATE POLICY "user_preferences_authenticated_all" ON public.user_preferences
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- admin_profile --------------------
ALTER TABLE public.admin_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profile_public_read" ON public.admin_profile;
CREATE POLICY "admin_profile_public_read" ON public.admin_profile
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "admin_profile_authenticated_all" ON public.admin_profile;
CREATE POLICY "admin_profile_authenticated_all" ON public.admin_profile
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- newsletter_subscriptions --------------------
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscriptions
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_authenticated_all" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_authenticated_all" ON public.newsletter_subscriptions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- community_comments --------------------
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_comments_public_read" ON public.community_comments;
CREATE POLICY "community_comments_public_read" ON public.community_comments
    FOR SELECT
    TO public
    USING (true);  -- أو USING (is_approved = true) لو عايز المعتمدة فقط

DROP POLICY IF EXISTS "community_comments_public_insert" ON public.community_comments;
CREATE POLICY "community_comments_public_insert" ON public.community_comments
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "community_comments_authenticated_all" ON public.community_comments;
CREATE POLICY "community_comments_authenticated_all" ON public.community_comments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 3. CONTENT MANAGEMENT TABLES (جداول إدارة المحتوى)
-- =====================================================

-- -------------------- editor_content --------------------
ALTER TABLE public.editor_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "editor_content_authenticated_all" ON public.editor_content;
CREATE POLICY "editor_content_authenticated_all" ON public.editor_content
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- content_revisions --------------------
ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_revisions_authenticated_all" ON public.content_revisions;
CREATE POLICY "content_revisions_authenticated_all" ON public.content_revisions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- sermon_tags --------------------
ALTER TABLE public.sermon_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sermon_tags_public_read" ON public.sermon_tags;
CREATE POLICY "sermon_tags_public_read" ON public.sermon_tags
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "sermon_tags_authenticated_all" ON public.sermon_tags;
CREATE POLICY "sermon_tags_authenticated_all" ON public.sermon_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- article_tags --------------------
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_tags_public_read" ON public.article_tags;
CREATE POLICY "article_tags_public_read" ON public.article_tags
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "article_tags_authenticated_all" ON public.article_tags;
CREATE POLICY "article_tags_authenticated_all" ON public.article_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- -------------------- content_tags --------------------
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_tags_public_read" ON public.content_tags;
CREATE POLICY "content_tags_public_read" ON public.content_tags
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "content_tags_authenticated_all" ON public.content_tags;
CREATE POLICY "content_tags_authenticated_all" ON public.content_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
