-- =====================================================
-- Check Existing Columns and Add Missing Ones
-- =====================================================
-- This script checks what columns exist and adds missing ones

-- =====================================================
-- First, let's see what columns actually exist in each table
-- =====================================================

-- Check articles table columns
SELECT 
    'articles' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'articles'
ORDER BY ordinal_position;

-- Check khutba table columns
SELECT 
    'khutba' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'khutba'
ORDER BY ordinal_position;

-- Check dars table columns
SELECT 
    'dars' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'dars'
ORDER BY ordinal_position;

-- Check books table columns
SELECT 
    'books' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'books'
ORDER BY ordinal_position;

-- =====================================================
-- Alternative table names check
-- =====================================================

-- Check for sermons table (alternative to khutba)
SELECT 
    'sermons' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sermons'
ORDER BY ordinal_position;

-- Check for lessons table (alternative to dars)
SELECT 
    'lessons' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lessons'
ORDER BY ordinal_position;

-- =====================================================
-- Safe column addition with proper error handling
-- =====================================================

-- Add font_family to articles (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE articles ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to articles table';
    ELSE
        RAISE NOTICE 'font_family column already exists in articles table';
    END IF;
END $$;

-- Add font_family to khutba (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'khutba' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE khutba ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to khutba table';
    ELSE
        RAISE NOTICE 'font_family column already exists in khutba table';
    END IF;
END $$;

-- Add font_family to dars (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dars' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE dars ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to dars table';
    ELSE
        RAISE NOTICE 'font_family column already exists in dars table';
    END IF;
END $$;

-- Add font_family to books (safe version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'books' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE books ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to books table';
    ELSE
        RAISE NOTICE 'font_family column already exists in books table';
    END IF;
END $$;

-- =====================================================
-- Try alternative table names if main ones don't exist
-- =====================================================

-- Add font_family to sermons (if khutba doesn't exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sermons'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sermons' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE sermons ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to sermons table';
    ELSE
        RAISE NOTICE 'font_family column already exists in sermons table or sermons table doesn''t exist';
    END IF;
END $$;

-- Add font_family to lessons (if dars doesn't exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'font_family'
    ) THEN
        EXECUTE 'ALTER TABLE lessons ADD COLUMN font_family VARCHAR(50) DEFAULT ''Cairo''';
        RAISE NOTICE 'Added font_family column to lessons table';
    ELSE
        RAISE NOTICE 'font_family column already exists in lessons table or lessons table doesn''t exist';
    END IF;
END $$;

-- =====================================================
-- Final verification
-- =====================================================

-- Show final table structures
SELECT 
    table_name,
    COUNT(*) as column_count,
    STRING_AGG(column_name ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'khutba', 'dars', 'books', 'sermons', 'lessons')
AND column_name = 'font_family'
GROUP BY table_name;
