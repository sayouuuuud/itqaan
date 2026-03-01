-- Fix article_tags table data types to match articles.id (uuid)

-- First, drop the existing table if it exists with wrong types
DROP TABLE IF EXISTS public.article_tags;

-- Recreate with correct types (using existing tags table with uuid)
CREATE TABLE IF NOT EXISTS public.article_tags (
    article_id uuid,
    tag_id uuid,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES public.articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_article_tags_article_id ON public.article_tags(article_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id ON public.article_tags(tag_id);

-- Add SEO columns to articles table if not exists
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Add tags column to articles table if not exists
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS tags text[];


