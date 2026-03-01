-- Add pdf_type column to books table
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS pdf_type TEXT DEFAULT 'local' CHECK (pdf_type IN ('local', 'external'));

-- Add pdf_external_url column for external links
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS pdf_external_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN books.pdf_type IS 'Type of PDF source: local (uploaded file) or external (URL)';
COMMENT ON COLUMN books.pdf_external_url IS 'External URL for PDF when pdf_type is external';
