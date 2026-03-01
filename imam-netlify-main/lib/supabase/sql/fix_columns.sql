-- 1. BOOKS: Ensure correct column exists and migrate data
DO $$
BEGIN
    -- Check if 'download_count' exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='download_count') THEN
        ALTER TABLE public.books ADD COLUMN download_count bigint DEFAULT 0;
    END IF;

    -- If legacy 'downloads_count' exists, copy data to 'download_count' (only if target is 0)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='downloads_count') THEN
        UPDATE public.books 
        SET download_count = downloads_count 
        WHERE (download_count IS NULL OR download_count = 0) AND downloads_count > 0;
    END IF;
END $$;

-- 2. LESSONS: Ensure correct column exists and migrate data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='download_count') THEN
        ALTER TABLE public.lessons ADD COLUMN download_count bigint DEFAULT 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='downloads_count') THEN
        UPDATE public.lessons 
        SET download_count = downloads_count 
        WHERE (download_count IS NULL OR download_count = 0) AND downloads_count > 0;
    END IF;
END $$;

-- 3. SERMONS: Ensure correct column exists and migrate data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sermons' AND column_name='download_count') THEN
        ALTER TABLE public.sermons ADD COLUMN download_count bigint DEFAULT 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sermons' AND column_name='downloads_count') THEN
        UPDATE public.sermons 
        SET download_count = downloads_count 
        WHERE (download_count IS NULL OR download_count = 0) AND downloads_count > 0;
    END IF;
END $$;

-- 4. Re-run the function definition to ensure it uses the correct column (just in case)
create or replace function public.increment_downloads(row_id uuid, table_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if table_name = 'books' then
    update public.books
    set download_count = coalesce(download_count, 0) + 1
    where id = row_id;
  elsif table_name = 'lessons' then
    update public.lessons
    set download_count = coalesce(download_count, 0) + 1
    where id = row_id;
  elsif table_name = 'sermons' then
    update public.sermons
    set download_count = coalesce(download_count, 0) + 1
    where id = row_id;
  else
    raise exception 'Invalid table name';
  end if;
end;
$$;
