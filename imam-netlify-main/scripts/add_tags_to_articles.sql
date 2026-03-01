-- Add tags array field to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Update existing articles with default empty tags array
UPDATE public.articles SET tags = '{}'::text[] WHERE tags IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for categorizing articles (e.g., {"فقه", "عقيدة", "حديث"})';




