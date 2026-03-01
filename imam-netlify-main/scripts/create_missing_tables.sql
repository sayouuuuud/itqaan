-- =====================================================
-- Database Schema Check and Table Creation
-- =====================================================
-- This script checks existing tables and creates missing ones
-- Run this first to ensure all required tables exist

-- =====================================================
-- Check existing tables
-- =====================================================

-- List all tables in the database
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =====================================================
-- Create tables if they don't exist
-- =====================================================

-- Create articles table if not exists
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create khutba table if not exists
CREATE TABLE IF NOT EXISTS khutba (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    audio_file_path VARCHAR(500),
    audio_url VARCHAR(500),
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create dars table if not exists
CREATE TABLE IF NOT EXISTS dars (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    audio_file_path VARCHAR(500),
    audio_url VARCHAR(500),
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create books table if not exists
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    short_title VARCHAR(100),
    cover_image VARCHAR(500),
    file_path VARCHAR(500),
    downloads INTEGER DEFAULT 0,
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Alternative table names (in case different naming is used)
-- =====================================================

-- Check for alternative table names
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%khutba%' OR
    table_name ILIKE '%khotba%' OR
    table_name ILIKE '%khutab%' OR
    table_name ILIKE '%sermon%' OR
    table_name ILIKE '%lesson%' OR
    table_name ILIKE '%dars%' OR
    table_name ILIKE '%article%'
)
ORDER BY table_name;

-- =====================================================
-- Create tables with alternative names if needed
-- =====================================================

-- Create sermons table if not exists (alternative to khutba)
CREATE TABLE IF NOT EXISTS sermons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    audio_file_path VARCHAR(500),
    audio_url VARCHAR(500),
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create lessons table if not exists (alternative to dars)
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    font_family VARCHAR(50) DEFAULT 'Cairo',
    audio_file_path VARCHAR(500),
    audio_url VARCHAR(500),
    publish_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Add font_family column to existing tables
-- =====================================================

-- Add font_family to all possible content tables
DO $$
BEGIN
    -- Add to articles
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articles' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE articles ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
    
    -- Add to khutba
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'khutba' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE khutba ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
    
    -- Add to sermons
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sermons' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE sermons ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
    
    -- Add to dars
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dars' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE dars ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
    
    -- Add to lessons
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE lessons ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
    
    -- Add to books
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'content') THEN
        EXECUTE 'ALTER TABLE books ADD COLUMN IF NOT EXISTS font_family VARCHAR(50) DEFAULT ''Cairo''';
    END IF;
END $$;

-- =====================================================
-- Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_articles_font_family ON articles(font_family);
CREATE INDEX IF NOT EXISTS idx_khutba_font_family ON khutba(font_family);
CREATE INDEX IF NOT EXISTS idx_sermons_font_family ON sermons(font_family);
CREATE INDEX IF NOT EXISTS idx_dars_font_family ON dars(font_family);
CREATE INDEX IF NOT EXISTS idx_lessons_font_family ON lessons(font_family);
CREATE INDEX IF NOT EXISTS idx_books_font_family ON books(font_family);

-- =====================================================
-- Verification and Summary
-- =====================================================

-- Show table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('articles', 'khutba', 'sermons', 'dars', 'lessons', 'books')
AND column_name = 'font_family'
ORDER BY table_name, column_name;

-- Show table counts
SELECT 
    'articles' as table_name, COUNT(*) as count FROM articles
UNION ALL
SELECT 
    'khutba' as table_name, COUNT(*) as count FROM khutba
UNION ALL
SELECT 
    'sermons' as table_name, COUNT(*) as count FROM sermons
UNION ALL
SELECT 
    'dars' as table_name, COUNT(*) as count FROM dars
UNION ALL
SELECT 
    'lessons' as table_name, COUNT(*) as count FROM lessons
UNION ALL
SELECT 
    'books' as table_name, COUNT(*) as count FROM books;
