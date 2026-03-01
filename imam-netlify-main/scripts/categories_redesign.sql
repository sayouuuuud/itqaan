-- =====================================================
-- Category System Redesign Migration
-- =====================================================
-- This script adds enhanced category features:
-- 1. Parent-child hierarchy support
-- 2. Icons, colors, and ordering
-- 3. Seed data for all content types
-- =====================================================

-- ================== STEP 1: ADD NEW COLUMNS ==================

-- Add parent_category_id for hierarchy
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add icon column (lucide icon name)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text DEFAULT 'folder';

-- Add color column (hex color)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#1e4338';

-- Add sort_order for custom ordering
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Add is_active flag
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add content_count for caching (optional, can be computed)
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS content_count integer DEFAULT 0;

-- ================== STEP 2: CREATE INDEXES ==================

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

-- ================== STEP 3: SEED DATA ==================

-- Clear old data if needed (COMMENT OUT if you want to keep existing)
-- DELETE FROM public.categories;

-- ==================== SERMONS (خطب) ====================
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, is_active) VALUES
(gen_random_uuid(), 'خطب الجمعة', 'friday-sermons', 'خطب يوم الجمعة الأسبوعية', 'sermon', 'calendar', '#16A34A', 1, true),
(gen_random_uuid(), 'خطب المناسبات', 'special-sermons', 'خطب الأعياد والمناسبات الإسلامية', 'sermon', 'star', '#EAB308', 2, true),
(gen_random_uuid(), 'خطب عامة', 'general-sermons', 'خطب متنوعة في مواضيع مختلفة', 'sermon', 'mic', '#6366F1', 3, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ==================== LESSONS (دروس) ====================
-- Parent Categories
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, is_active) VALUES
(gen_random_uuid(), 'فقه العبادات', 'fiqh-worship', 'أحكام الطهارة والصلاة والزكاة والصوم والحج', 'lesson', 'book-open', '#0891B2', 1, true),
(gen_random_uuid(), 'فقه المعاملات', 'fiqh-transactions', 'أحكام البيع والشراء والعقود', 'lesson', 'scale', '#0D9488', 2, true),
(gen_random_uuid(), 'العقيدة', 'aqeedah', 'دروس في أصول الإيمان والتوحيد', 'lesson', 'shield', '#DC2626', 3, true),
(gen_random_uuid(), 'التفسير', 'tafsir', 'تفسير القرآن الكريم', 'lesson', 'book', '#7C3AED', 4, true),
(gen_random_uuid(), 'الحديث', 'hadith', 'شرح الأحاديث النبوية', 'lesson', 'scroll', '#EA580C', 5, true),
(gen_random_uuid(), 'السيرة النبوية', 'seerah', 'سيرة النبي صلى الله عليه وسلم', 'lesson', 'heart', '#DB2777', 6, true),
(gen_random_uuid(), 'الأخلاق والتزكية', 'akhlaq', 'تهذيب النفس والسلوك', 'lesson', 'sparkles', '#F59E0B', 7, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- Child Categories for فقه العبادات
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, parent_category_id, is_active)
SELECT 
    gen_random_uuid(), 
    'أحكام الطهارة', 
    'tahara', 
    'الوضوء والغسل والتيمم',
    'lesson', 
    'droplet', 
    '#0891B2', 
    1, 
    (SELECT id FROM public.categories WHERE slug = 'fiqh-worship' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'tahara');

INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, parent_category_id, is_active)
SELECT 
    gen_random_uuid(), 
    'أحكام الصلاة', 
    'salah', 
    'الصلوات المفروضة والنوافل',
    'lesson', 
    'moon', 
    '#0891B2', 
    2, 
    (SELECT id FROM public.categories WHERE slug = 'fiqh-worship' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'salah');

INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, parent_category_id, is_active)
SELECT 
    gen_random_uuid(), 
    'أحكام الزكاة', 
    'zakat', 
    'زكاة المال والفطر',
    'lesson', 
    'coins', 
    '#0891B2', 
    3, 
    (SELECT id FROM public.categories WHERE slug = 'fiqh-worship' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'zakat');

INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, parent_category_id, is_active)
SELECT 
    gen_random_uuid(), 
    'أحكام الصيام', 
    'siyam', 
    'صيام رمضان والنوافل',
    'lesson', 
    'sunrise', 
    '#0891B2', 
    4, 
    (SELECT id FROM public.categories WHERE slug = 'fiqh-worship' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'siyam');

INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, parent_category_id, is_active)
SELECT 
    gen_random_uuid(), 
    'أحكام الحج والعمرة', 
    'hajj', 
    'مناسك الحج والعمرة',
    'lesson', 
    'map-pin', 
    '#0891B2', 
    5, 
    (SELECT id FROM public.categories WHERE slug = 'fiqh-worship' LIMIT 1),
    true
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'hajj');

-- ==================== ARTICLES (مقالات) ====================
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, is_active) VALUES
(gen_random_uuid(), 'مقالات فقهية', 'fiqh-articles', 'مقالات في الفقه الإسلامي', 'article', 'file-text', '#2563EB', 1, true),
(gen_random_uuid(), 'مقالات عقدية', 'aqeedah-articles', 'مقالات في العقيدة والتوحيد', 'article', 'shield', '#DC2626', 2, true),
(gen_random_uuid(), 'مقالات تربوية', 'educational-articles', 'مقالات في التربية الإسلامية', 'article', 'graduation-cap', '#16A34A', 3, true),
(gen_random_uuid(), 'مقالات اجتماعية', 'social-articles', 'قضايا المجتمع المسلم', 'article', 'users', '#9333EA', 4, true),
(gen_random_uuid(), 'ردود علمية', 'scientific-responses', 'ردود على الشبهات والإشكالات', 'article', 'message-circle', '#EF4444', 5, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ==================== BOOKS (كتب) ====================
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, is_active) VALUES
(gen_random_uuid(), 'كتب فقهية', 'fiqh-books', 'كتب في الفقه الإسلامي', 'book', 'book', '#0891B2', 1, true),
(gen_random_uuid(), 'كتب عقدية', 'aqeedah-books', 'كتب في العقيدة والتوحيد', 'book', 'shield', '#DC2626', 2, true),
(gen_random_uuid(), 'كتب تفسير', 'tafsir-books', 'كتب تفسير القرآن الكريم', 'book', 'book-open', '#7C3AED', 3, true),
(gen_random_uuid(), 'كتب حديث', 'hadith-books', 'شروحات الأحاديث النبوية', 'book', 'scroll', '#EA580C', 4, true),
(gen_random_uuid(), 'رسائل علمية', 'research-papers', 'رسائل الماجستير والدكتوراه', 'book', 'file-text', '#6366F1', 5, true),
(gen_random_uuid(), 'كتب تربوية', 'educational-books', 'كتب في التربية والتزكية', 'book', 'graduation-cap', '#16A34A', 6, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ==================== MEDIA (مرئيات وصوتيات) ====================
INSERT INTO public.categories (id, name, slug, description, type, icon, color, sort_order, is_active) VALUES
(gen_random_uuid(), 'لقاءات تلفزيونية', 'tv-interviews', 'مقابلات وبرامج تلفزيونية', 'media', 'tv', '#DC2626', 1, true),
(gen_random_uuid(), 'محاضرات مصورة', 'video-lectures', 'محاضرات ودروس مصورة', 'media', 'video', '#7C3AED', 2, true),
(gen_random_uuid(), 'مقاطع قصيرة', 'short-clips', 'مقاطع قصيرة ومميزة', 'media', 'film', '#F59E0B', 3, true),
(gen_random_uuid(), 'صوتيات', 'audio-content', 'تسجيلات صوتية', 'media', 'headphones', '#0891B2', 4, true),
(gen_random_uuid(), 'بث مباشر', 'live-streams', 'أرشيف البث المباشر', 'media', 'radio', '#EF4444', 5, true)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    sort_order = EXCLUDED.sort_order;

-- ================== STEP 4: VERIFY ==================
-- Run this to check the new categories:
-- SELECT type, name, slug, icon, color, sort_order, parent_category_id FROM public.categories ORDER BY type, sort_order;
