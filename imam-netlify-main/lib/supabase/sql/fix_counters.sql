-- Function to safely increment download counts
-- This function runs with SECURITY DEFINER to bypass RLS, allowing public users to increment the counter
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
  elsif table_name = 'articles' then
    update public.articles
    set views_count = coalesce(views_count, 0) + 1 -- Articles use views_count
    where id = row_id;
  else
    raise exception 'Invalid table name';
  end if;
end;
$$;

-- Grant execution to everyone (public/anon)
grant execute on function public.increment_downloads(uuid, text) to public;
grant execute on function public.increment_downloads(uuid, text) to anon;
grant execute on function public.increment_downloads(uuid, text) to authenticated;
grant execute on function public.increment_downloads(uuid, text) to service_role;
