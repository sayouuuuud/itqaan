-- =====================================================
-- Font Family Fix for Content Tables
-- =====================================================
-- This script adds font-family column to content tables
-- and updates existing records with proper font styling

-- 1. Add font_family column to articles table
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Cairo';

-- 2. Add font_family column to khutba table  
ALTER TABLE khutba 
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Cairo';

-- 3. Add font_family column to dars table
ALTER TABLE dars 
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Cairo';

-- 4. Add font_family column to books table (if it has content)
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT 'Cairo';

-- =====================================================
-- Update existing content with font-family styling
-- =====================================================

-- Update articles content to include font-family
UPDATE articles 
SET content = CASE 
    WHEN content IS NOT NULL AND content != '' THEN
        CASE 
            WHEN content LIKE '%font-family:%' THEN content
            ELSE CONCAT('<div style="font-family: ', COALESCE(font_family, 'Cairo'), '; direction: rtl;">', content, '</div>')
        END
    ELSE content
END,
    updated_at = NOW()
WHERE content IS NOT NULL AND content != '';

-- Update khutba content to include font-family
UPDATE khutba 
SET content = CASE 
    WHEN content IS NOT NULL AND content != '' THEN
        CASE 
            WHEN content LIKE '%font-family:%' THEN content
            ELSE CONCAT('<div style="font-family: ', COALESCE(font_family, 'Cairo'), '; direction: rtl;">', content, '</div>')
        END
    ELSE content
END,
    updated_at = NOW()
WHERE content IS NOT NULL AND content != '';

-- Update dars content to include font-family
UPDATE dars 
SET content = CASE 
    WHEN content IS NOT NULL AND content != '' THEN
        CASE 
            WHEN content LIKE '%font-family:%' THEN content
            ELSE CONCAT('<div style="font-family: ', COALESCE(font_family, 'Cairo'), '; direction: rtl;">', content, '</div>')
        END
    ELSE content
END,
    updated_at = NOW()
WHERE content IS NOT NULL AND content != '';

-- Update books content to include font-family (if books has content column)
UPDATE books 
SET content = CASE 
    WHEN content IS NOT NULL AND content != '' THEN
        CASE 
            WHEN content LIKE '%font-family:%' THEN content
            ELSE CONCAT('<div style="font-family: ', COALESCE(font_family, 'Cairo'), '; direction: rtl;">', content, '</div>')
        END
    ELSE content
END,
    updated_at = NOW()
WHERE content IS NOT NULL AND content != '';

-- =====================================================
-- Extract font-family from existing content and update font_family column
-- =====================================================

-- Update font_family for articles based on existing content
UPDATE articles 
SET font_family = CASE
    WHEN content LIKE '%font-family:%' THEN
        CASE 
            WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
            WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
            WHEN content LIKE '%font-family: Cairo%' THEN 'Cairo'
            WHEN content LIKE '%font-family: Amiri%' THEN 'Amiri'
            ELSE 'Cairo'
        END
    ELSE font_family
WHERE content IS NOT NULL;

-- Update font_family for khutba based on existing content
UPDATE khutba 
SET font_family = CASE
    WHEN content LIKE '%font-family:%' THEN
        CASE 
            WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
            WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
            WHEN content LIKE '%font-family: Cairo%' THEN 'Cairo'
            WHEN content LIKE '%font-family: Amiri%' THEN 'Amiri'
            ELSE 'Cairo'
        END
    ELSE font_family
WHERE content IS NOT NULL;

-- Update font_family for dars based on existing content
UPDATE dars 
SET font_family = CASE
    WHEN content LIKE '%font-family:%' THEN
        CASE 
            WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
            WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
            WHEN content LIKE '%font-family: Cairo%' THEN 'Cairo'
            WHEN content LIKE '%font-family: Amiri%' THEN 'Amiri'
            ELSE 'Cairo'
        END
    ELSE font_family
WHERE content IS NOT NULL;

-- Update font_family for books based on existing content
UPDATE books 
SET font_family = CASE
    WHEN content LIKE '%font-family:%' THEN
        CASE 
            WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
            WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
            WHEN content LIKE '%font-family: Cairo%' THEN 'Cairo'
            WHEN content LIKE '%font-family: Amiri%' THEN 'Amiri'
            ELSE 'Cairo'
        END
    ELSE font_family
WHERE content IS NOT NULL;

-- =====================================================
-- Create indexes for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_articles_font_family ON articles(font_family);
CREATE INDEX IF NOT EXISTS idx_khutba_font_family ON khutba(font_family);
CREATE INDEX IF NOT EXISTS idx_dars_font_family ON dars(font_family);
CREATE INDEX IF NOT EXISTS idx_books_font_family ON books(font_family);

-- =====================================================
-- Verification queries
-- =====================================================

-- Check articles table
SELECT 
    COUNT(*) as total_articles,
    COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_count,
    COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_count,
    COUNT(CASE WHEN font_family IS NULL THEN 1 END) as null_font_family
FROM articles;

-- Check khutba table
SELECT 
    COUNT(*) as total_khutba,
    COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_count,
    COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_count,
    COUNT(CASE WHEN font_family IS NULL THEN 1 END) as null_font_family
FROM khutba;

-- Check dars table
SELECT 
    COUNT(*) as total_dars,
    COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_count,
    COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_count,
    COUNT(CASE WHEN font_family IS NULL THEN 1 END) as null_font_family
FROM dars;

-- Check books table (if it exists)
SELECT 
    COUNT(*) as total_books,
    COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_count,
    COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_count,
    COUNT(CASE WHEN font_family IS NULL THEN 1 END) as null_font_family
FROM books;

-- =====================================================
-- Sample content fixes
-- =====================================================

-- Fix content that has multiple font-family declarations
UPDATE articles 
SET content = REGEXP_REPLACE(content, '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>(.*?)</div>', '<div style="font-family: ' || COALESCE(font_family, 'Cairo') || '; direction: rtl;">$1</div>'),
    font_family = CASE 
        WHEN content LIKE '%font-family:%' THEN
            CASE 
                WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
                WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
                ELSE 'Cairo'
            END
        ELSE font_family
    END
WHERE content LIKE '%font-family:%' AND content REGEXP '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>.*</div>.*</div>';

-- Same fixes for khutba
UPDATE khutba 
SET content = REGEXP_REPLACE(content, '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>(.*?)</div>', '<div style="font-family: ' || COALESCE(font_family, 'Cairo') || '; direction: rtl;">$1</div>'),
    font_family = CASE 
        WHEN content LIKE '%font-family:%' THEN
            CASE 
                WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
                WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
                ELSE 'Cairo'
            END
        ELSE font_family
    END
WHERE content LIKE '%font-family:%' AND content REGEXP '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>.*</div>.*</div>';

-- Same fixes for dars
UPDATE dars 
SET content = REGEXP_REPLACE(content, '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>(.*?)</div>', '<div style="font-family: ' || COALESCE(font_family, 'Cairo') || '; direction: rtl;">$1</div>'),
    font_family = CASE 
        WHEN content LIKE '%font-family:%' THEN
            CASE 
                WHEN content LIKE '%font-family: "Cairo"%' THEN 'Cairo'
                WHEN content LIKE '%font-family: "Amiri"%' THEN 'Amiri'
                ELSE 'Cairo'
            END
        ELSE font_family
    END
WHERE content LIKE '%font-family:%' AND content REGEXP '<div[^>]*style="[^"]*font-family:[^"]*"[^>]*>.*</div>.*</div>';

-- =====================================================
-- Final verification
-- =====================================================

-- Show summary of changes
SELECT 'articles' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_font,
       COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_font,
       COUNT(CASE WHEN content LIKE '%font-family:%' THEN 1 END) as has_font_styling
FROM articles
UNION ALL
SELECT 'khutba' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_font,
       COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_font,
       COUNT(CASE WHEN content LIKE '%font-family:%' THEN 1 END) as has_font_styling
FROM khutba
UNION ALL
SELECT 'dars' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN font_family = 'Cairo' THEN 1 END) as cairo_font,
       COUNT(CASE WHEN font_family = 'Amiri' THEN 1 END) as amiri_font,
       COUNT(CASE WHEN content LIKE '%font-family:%' THEN 1 END) as has_font_styling
FROM dars;
