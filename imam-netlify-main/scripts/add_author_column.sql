-- Add author column to sermons
ALTER TABLE sermons ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'السيد مراد سلامة';

-- Add author column to lessons
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'السيد مراد سلامة';

-- Add author column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'السيد مراد سلامة';

-- Add author column to books
ALTER TABLE books ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'السيد مراد سلامة';

-- Update existing records to have the default author name if it is null
UPDATE sermons SET author_name = 'السيد مراد سلامة' WHERE author_name IS NULL;
UPDATE lessons SET author_name = 'السيد مراد سلامة' WHERE author_name IS NULL;
UPDATE articles SET author_name = 'السيد مراد سلامة' WHERE author_name IS NULL;
UPDATE books SET author_name = 'السيد مراد سلامة' WHERE author_name IS NULL;
