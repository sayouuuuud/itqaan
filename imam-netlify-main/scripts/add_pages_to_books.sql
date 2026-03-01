-- Migration: Add pages field to books table
-- This script adds the pages column to the books table for automatic page count detection

-- Check if pages column exists and add it if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'books'
        AND column_name = 'pages'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.books ADD COLUMN pages integer;
        RAISE NOTICE '✅ تم إضافة حقل pages إلى جدول books';
    ELSE
        RAISE NOTICE 'ℹ️ حقل pages موجود بالفعل في جدول books';
    END IF;
END $$;

-- Optional: Update existing books with NULL pages to have a default value
-- Uncomment the following lines if you want to set a default value for existing books
-- UPDATE public.books SET pages = NULL WHERE pages IS NULL;

COMMENT ON COLUMN public.books.pages IS 'عدد صفحات الكتاب - يتم تحديده تلقائياً من ملف PDF';





















