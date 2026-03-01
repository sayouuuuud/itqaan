-- Add archive_url column to books table to store old Cloudinary URLs
ALTER TABLE books
ADD COLUMN IF NOT EXISTS archive_url TEXT;

-- Index for faster cleanup queries
CREATE INDEX IF NOT EXISTS idx_books_archive_url ON books(archive_url) WHERE archive_url IS NOT NULL;
