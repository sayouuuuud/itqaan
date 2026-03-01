-- Add tags array field to sermons table
ALTER TABLE public.sermons ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Update existing sermons with default empty tags array
UPDATE public.sermons SET tags = '{}'::text[] WHERE tags IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.sermons.tags IS 'Array of tags for categorizing sermons (e.g., {"الأخوة_الإيمانية", "المجتمع_المسلم"})';




