-- Final Logic Implementation
-- 1. Ensure 'download_count' column exists in all tables
DO $$
BEGIN
    -- Books
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='books' AND column_name='download_count') THEN
        ALTER TABLE public.books ADD COLUMN download_count bigint DEFAULT 0;
    END IF;
    -- Lessons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lessons' AND column_name='download_count') THEN
        ALTER TABLE public.lessons ADD COLUMN download_count bigint DEFAULT 0;
    END IF;
    -- Sermons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sermons' AND column_name='download_count') THEN
        ALTER TABLE public.sermons ADD COLUMN download_count bigint DEFAULT 0;
    END IF;
END $$;

-- 2. Create Global Function with TEXT ID to prevent Type Mimecasts (UUID vs Int)
create or replace function public.increment_downloads(row_id text, table_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if table_name = 'books' then
    -- Cast id to text to compare safely regardless of whether it's UUID or Int
    update public.books
    set download_count = coalesce(download_count, 0) + 1
    where id::text = row_id;
  elsif table_name = 'lessons' then
    update public.lessons
    set download_count = coalesce(download_count, 0) + 1
    where id::text = row_id;
  elsif table_name = 'sermons' then
    update public.sermons
    set download_count = coalesce(download_count, 0) + 1
    where id::text = row_id;
  else
    raise exception 'Invalid table name';
  end if;
end;
$$;

-- 3. Grant Permissions
grant execute on function public.increment_downloads(text, text) to public;
grant execute on function public.increment_downloads(text, text) to anon;
grant execute on function public.increment_downloads(text, text) to authenticated;
grant execute on function public.increment_downloads(text, text) to service_role;
