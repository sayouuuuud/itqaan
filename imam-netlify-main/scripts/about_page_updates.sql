-- =====================================================
-- Complete About Page Database Schema
-- =====================================================
-- This SQL ensures all required columns and tables exist
-- for the /admin/about page to work correctly
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- Step 1: Add ALL missing columns to about_page table
-- =====================================================

-- Basic columns that might be missing
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS location text;

-- Photo columns (ensure both exist)
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS sheikh_photo text;
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS image_path text;

-- Positions column (both names for compatibility)
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS current_positions text;
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS positions text;

-- Mission and Vision (for the new sections)
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS mission_text text;
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS vision_text text;

-- Make sure social_links exists as JSONB
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '[]'::jsonb;

-- Ensure stats is JSONB
ALTER TABLE public.about_page ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}'::jsonb;

-- =====================================================
-- Step 2: Create about_timeline table if not exists
-- =====================================================
CREATE TABLE IF NOT EXISTS public.about_timeline (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    year text NOT NULL,
    title text NOT NULL,
    description text,
    icon text DEFAULT 'graduation',
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_timeline ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read about_timeline" ON public.about_timeline;
DROP POLICY IF EXISTS "Allow authenticated write about_timeline" ON public.about_timeline;
DROP POLICY IF EXISTS "Allow all about_timeline" ON public.about_timeline;

-- Create policies
CREATE POLICY "Allow public read about_timeline" ON public.about_timeline FOR SELECT USING (true);
CREATE POLICY "Allow all about_timeline" ON public.about_timeline FOR ALL USING (true);

-- =====================================================
-- Step 3: Create about_quotes table if not exists
-- =====================================================
CREATE TABLE IF NOT EXISTS public.about_quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_text text NOT NULL,
    category text DEFAULT 'علم',
    order_index integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.about_quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read about_quotes" ON public.about_quotes;
DROP POLICY IF EXISTS "Allow authenticated write about_quotes" ON public.about_quotes;
DROP POLICY IF EXISTS "Allow all about_quotes" ON public.about_quotes;

-- Create policies
CREATE POLICY "Allow public read about_quotes" ON public.about_quotes FOR SELECT USING (true);
CREATE POLICY "Allow all about_quotes" ON public.about_quotes FOR ALL USING (true);

-- =====================================================
-- Step 4: Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_about_timeline_order ON public.about_timeline (order_index);
CREATE INDEX IF NOT EXISTS idx_about_timeline_active ON public.about_timeline (is_active);
CREATE INDEX IF NOT EXISTS idx_about_quotes_order ON public.about_quotes (order_index);
CREATE INDEX IF NOT EXISTS idx_about_quotes_active ON public.about_quotes (is_active);

-- =====================================================
-- Step 5: Ensure at least one record exists in about_page
-- =====================================================
INSERT INTO public.about_page (
    id,
    sheikh_name,
    biography,
    title,
    position,
    location,
    mission_text,
    vision_text,
    stats,
    social_links
)
SELECT 
    gen_random_uuid(),
    'الشيخ السيد مراد',
    'السيرة الذاتية للشيخ',
    'عالم أزهري',
    'إمام مسجد',
    'مصر',
    'نسعى لنشر العلم الشرعي الصحيح',
    'بناء جيل واعٍ بدينه',
    '{"students": "5000+", "books": "20+", "lectures": "1000+", "years": "25+"}'::jsonb,
    '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.about_page LIMIT 1);

-- =====================================================
-- Step 6: Insert sample timeline data if empty
-- =====================================================
INSERT INTO public.about_timeline (year, title, description, icon, order_index)
SELECT * FROM (VALUES
    ('١٩٨٥', 'المولد والنشأة', 'وُلد الشيخ في بيئة علمية تهتم بتحفيظ القرآن الكريم', 'baby', 1),
    ('١٩٩٥', 'حفظ القرآن الكريم', 'أتم حفظ القرآن الكريم كاملاً وهو في سن العاشرة', 'book', 2),
    ('٢٠٠٥', 'التخرج من الأزهر', 'حصل على ليسانس الشريعة والقانون من جامعة الأزهر الشريف', 'graduation', 3),
    ('٢٠١٠', 'إمام مسجد الرحمن', 'تم تعيينه إماماً وخطيباً لمسجد الرحمن', 'mosque', 4),
    ('٢٠٢٠', 'إطلاق الموقع الإلكتروني', 'أسس الموقع الإلكتروني لنشر العلم الشرعي', 'globe', 5)
) AS t(year, title, description, icon, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.about_timeline LIMIT 1);

-- =====================================================
-- Step 7: Insert sample quotes data if empty
-- =====================================================
INSERT INTO public.about_quotes (quote_text, category, order_index)
SELECT * FROM (VALUES
    ('العلم نور يبدد ظلمات الجهل ويهدي إلى سواء السبيل', 'علم', 1),
    ('من أراد الدنيا فعليه بالعلم ومن أراد الآخرة فعليه بالعلم', 'علم', 2),
    ('التوحيد هو أساس كل خير وأصل كل فلاح', 'عقيدة', 3),
    ('الصبر على طلب العلم من أعظم أنواع الصبر', 'حكمة', 4)
) AS t(quote_text, category, order_index)
WHERE NOT EXISTS (SELECT 1 FROM public.about_quotes LIMIT 1);

-- =====================================================
-- Verification: Check what was created/updated
-- =====================================================
-- Run these to verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'about_page' ORDER BY ordinal_position;
-- SELECT * FROM public.about_page LIMIT 1;
-- SELECT * FROM public.about_timeline ORDER BY order_index;
-- SELECT * FROM public.about_quotes ORDER BY order_index;
