-- =====================================================
-- Supabase Security Cleanup & Fixes
-- =====================================================
-- 1. Fix function search_path
-- 2. Clean up duplicate policies
-- 3. Tighten policies where possible
-- =====================================================

-- =====================================================
-- STEP 1: FIX FUNCTION SEARCH_PATH
-- =====================================================

-- Fix notify_new_contact_message
ALTER FUNCTION public.notify_new_contact_message() SET search_path = public;

-- Fix notify_new_subscriber
ALTER FUNCTION public.notify_new_subscriber() SET search_path = public;

-- Fix track_content_changes
ALTER FUNCTION public.track_content_changes() SET search_path = public;

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- =====================================================
-- STEP 2: CLEAN UP ALL POLICIES AND RECREATE
-- =====================================================

-- -------------------- appearance_settings --------------------
DROP POLICY IF EXISTS "Allow all appearance_settings" ON public.appearance_settings;
DROP POLICY IF EXISTS "Allow all on appearance_settings" ON public.appearance_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert appearance_settings" ON public.appearance_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update appearance_settings" ON public.appearance_settings;
DROP POLICY IF EXISTS "appearance_settings_public_read" ON public.appearance_settings;
DROP POLICY IF EXISTS "appearance_settings_authenticated_modify" ON public.appearance_settings;

CREATE POLICY "appearance_settings_public_read" ON public.appearance_settings
    FOR SELECT TO public USING (true);
CREATE POLICY "appearance_settings_authenticated_modify" ON public.appearance_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- navbar_items --------------------
DROP POLICY IF EXISTS "Allow all navbar_items" ON public.navbar_items;

-- -------------------- site_settings --------------------
DROP POLICY IF EXISTS "Allow authenticated users to insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update site_settings" ON public.site_settings;

-- -------------------- tags --------------------
DROP POLICY IF EXISTS "Allow all tags" ON public.tags;

-- -------------------- notifications --------------------
DROP POLICY IF EXISTS "Admin full access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated update notifications" ON public.notifications;
DROP POLICY IF EXISTS "notifications_public_read" ON public.notifications;
DROP POLICY IF EXISTS "notifications_authenticated_modify" ON public.notifications;

CREATE POLICY "notifications_public_read" ON public.notifications
    FOR SELECT TO public USING (true);
CREATE POLICY "notifications_authenticated_modify" ON public.notifications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- contact_fields --------------------
DROP POLICY IF EXISTS "Admin full access to contact_fields" ON public.contact_fields;
DROP POLICY IF EXISTS "Allow all on contact_fields" ON public.contact_fields;
DROP POLICY IF EXISTS "contact_fields_public_read" ON public.contact_fields;
DROP POLICY IF EXISTS "contact_fields_authenticated_modify" ON public.contact_fields;

CREATE POLICY "contact_fields_public_read" ON public.contact_fields
    FOR SELECT TO public USING (true);
CREATE POLICY "contact_fields_authenticated_modify" ON public.contact_fields
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- contact_settings --------------------
DROP POLICY IF EXISTS "Allow authenticated insert on contact_settings" ON public.contact_settings;
DROP POLICY IF EXISTS "Allow authenticated update on contact_settings" ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_public_read" ON public.contact_settings;
DROP POLICY IF EXISTS "contact_settings_authenticated_modify" ON public.contact_settings;

CREATE POLICY "contact_settings_public_read" ON public.contact_settings
    FOR SELECT TO public USING (true);
CREATE POLICY "contact_settings_authenticated_modify" ON public.contact_settings
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- contact_submissions --------------------
DROP POLICY IF EXISTS "Allow all on contact_submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_public_insert" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_authenticated_read" ON public.contact_submissions;
DROP POLICY IF EXISTS "contact_submissions_authenticated_modify" ON public.contact_submissions;

CREATE POLICY "contact_submissions_public_insert" ON public.contact_submissions
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "contact_submissions_authenticated_read" ON public.contact_submissions
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "contact_submissions_authenticated_modify" ON public.contact_submissions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- contact_messages --------------------
DROP POLICY IF EXISTS "Public can insert contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_public_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_insert" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_authenticated_read" ON public.contact_messages;
DROP POLICY IF EXISTS "contact_messages_authenticated_modify" ON public.contact_messages;

CREATE POLICY "contact_messages_insert" ON public.contact_messages
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "contact_messages_authenticated_read" ON public.contact_messages
    FOR SELECT TO authenticated USING (true);
CREATE POLICY "contact_messages_authenticated_modify" ON public.contact_messages
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- events --------------------
DROP POLICY IF EXISTS "Admin full access to events" ON public.events;
DROP POLICY IF EXISTS "events_public_read" ON public.events;
DROP POLICY IF EXISTS "events_authenticated_modify" ON public.events;

CREATE POLICY "events_public_read" ON public.events
    FOR SELECT TO public USING (true);
CREATE POLICY "events_authenticated_modify" ON public.events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- schedule_events --------------------
DROP POLICY IF EXISTS "Allow all schedule_events" ON public.schedule_events;
DROP POLICY IF EXISTS "schedule_events_public_read" ON public.schedule_events;
DROP POLICY IF EXISTS "schedule_events_authenticated_modify" ON public.schedule_events;

CREATE POLICY "schedule_events_public_read" ON public.schedule_events
    FOR SELECT TO public USING (true);
CREATE POLICY "schedule_events_authenticated_modify" ON public.schedule_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- sheikh_profile --------------------
DROP POLICY IF EXISTS "Allow all sheikh_profile" ON public.sheikh_profile;
DROP POLICY IF EXISTS "sheikh_profile_public_read" ON public.sheikh_profile;
DROP POLICY IF EXISTS "sheikh_profile_authenticated_modify" ON public.sheikh_profile;

CREATE POLICY "sheikh_profile_public_read" ON public.sheikh_profile
    FOR SELECT TO public USING (true);
CREATE POLICY "sheikh_profile_authenticated_modify" ON public.sheikh_profile
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- about_quotes --------------------
DROP POLICY IF EXISTS "Allow all about_quotes" ON public.about_quotes;
DROP POLICY IF EXISTS "about_quotes_public_read" ON public.about_quotes;
DROP POLICY IF EXISTS "about_quotes_authenticated_modify" ON public.about_quotes;

CREATE POLICY "about_quotes_public_read" ON public.about_quotes
    FOR SELECT TO public USING (true);
CREATE POLICY "about_quotes_authenticated_modify" ON public.about_quotes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- about_timeline --------------------
DROP POLICY IF EXISTS "Allow all about_timeline" ON public.about_timeline;
DROP POLICY IF EXISTS "about_timeline_public_read" ON public.about_timeline;
DROP POLICY IF EXISTS "about_timeline_authenticated_modify" ON public.about_timeline;

CREATE POLICY "about_timeline_public_read" ON public.about_timeline
    FOR SELECT TO public USING (true);
CREATE POLICY "about_timeline_authenticated_modify" ON public.about_timeline
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- analytics --------------------
DROP POLICY IF EXISTS "Allow all on analytics" ON public.analytics;
DROP POLICY IF EXISTS "analytics_public_read" ON public.analytics;
DROP POLICY IF EXISTS "analytics_public_insert" ON public.analytics;
DROP POLICY IF EXISTS "analytics_authenticated_modify" ON public.analytics;

CREATE POLICY "analytics_public_read" ON public.analytics
    FOR SELECT TO public USING (true);
CREATE POLICY "analytics_public_insert" ON public.analytics
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "analytics_authenticated_modify" ON public.analytics
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- comments --------------------
DROP POLICY IF EXISTS "Public can insert comments" ON public.comments;
DROP POLICY IF EXISTS "comments_public_read_approved" ON public.comments;
DROP POLICY IF EXISTS "comments_public_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_authenticated_all" ON public.comments;

CREATE POLICY "comments_public_read_approved" ON public.comments
    FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "comments_public_insert" ON public.comments
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "comments_authenticated_all" ON public.comments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- community_posts --------------------
DROP POLICY IF EXISTS "Admin full access to community_posts" ON public.community_posts;
DROP POLICY IF EXISTS "Allow public insert" ON public.community_posts;
DROP POLICY IF EXISTS "Public can insert community posts" ON public.community_posts;
DROP POLICY IF EXISTS "Public can submit community posts" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_public_insert" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_public_read" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_authenticated_all" ON public.community_posts;

CREATE POLICY "community_posts_public_read" ON public.community_posts
    FOR SELECT TO public USING (is_approved = true);
CREATE POLICY "community_posts_public_insert" ON public.community_posts
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "community_posts_authenticated_all" ON public.community_posts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- subscribers --------------------
DROP POLICY IF EXISTS "Public can subscribe" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_public_insert" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_authenticated_all" ON public.subscribers;

CREATE POLICY "subscribers_public_insert" ON public.subscribers
    FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "subscribers_authenticated_all" ON public.subscribers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- -------------------- site_analytics --------------------
DROP POLICY IF EXISTS "Allow authenticated insert to site_analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "Allow authenticated update to site_analytics" ON public.site_analytics;
DROP POLICY IF EXISTS "site_analytics_public_read" ON public.site_analytics;
DROP POLICY IF EXISTS "site_analytics_authenticated_all" ON public.site_analytics;

CREATE POLICY "site_analytics_public_read" ON public.site_analytics
    FOR SELECT TO public USING (true);
CREATE POLICY "site_analytics_authenticated_all" ON public.site_analytics
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- After running, check with:
-- SELECT * FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
