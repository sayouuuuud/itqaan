-- =====================================================
-- Simple Font Family Column Addition
-- =====================================================
-- Run this script first to add font_family columns safely

-- Check if font_family column exists in articles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'font_family'
    ) THEN
        ALTER TABLE articles ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to articles';
    END IF;
END $$;

-- Check if font_family column exists in khutba
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'khutba' 
        AND column_name = 'font_family'
    ) THEN
        ALTER TABLE khutba ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to khutba';
    END IF;
END $$;

-- Check if font_family column exists in dars
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dars' 
        AND column_name = 'font_family'
    ) THEN
        ALTER TABLE dars ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to dars';
    END IF;
END $$;

-- Check if font_family column exists in books
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'books' 
        AND column_name = 'font_family'
    ) THEN
        ALTER TABLE books ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to books';
    END IF;
END $$;

-- Alternative table names (just in case)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sermons') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sermons' AND column_name = 'font_family') THEN
        ALTER TABLE sermons ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to sermons';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lessons') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lessons' AND column_name = 'font_family') THEN
        ALTER TABLE lessons ADD COLUMN font_family VARCHAR(50) DEFAULT 'Cairo';
        RAISE NOTICE 'Added font_family to lessons';
    END IF;
END $$;

-- =====================================================
-- Verification
-- =====================================================

-- Show what we have now
SELECT 
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'khutba', 'dars', 'books', 'sermons', 'lessons')
AND column_name = 'font_family'
ORDER BY table_name;
