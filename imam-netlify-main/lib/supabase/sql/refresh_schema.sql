-- Ensure permissions for the new column
-- Often RLS policies are row-based, but let's confirm no column-level security is blocking it.

GRANT SELECT (download_count) ON public.books TO public;
GRANT SELECT (download_count) ON public.books TO anon;
GRANT SELECT (download_count) ON public.books TO authenticated;
GRANT SELECT (download_count) ON public.books TO service_role;

GRANT SELECT (download_count) ON public.lessons TO public;
GRANT SELECT (download_count) ON public.lessons TO anon;
GRANT SELECT (download_count) ON public.lessons TO authenticated;
GRANT SELECT (download_count) ON public.lessons TO service_role;

GRANT SELECT (download_count) ON public.sermons TO public;
GRANT SELECT (download_count) ON public.sermons TO anon;
GRANT SELECT (download_count) ON public.sermons TO authenticated;
GRANT SELECT (download_count) ON public.sermons TO service_role;

-- Force schema cache reload in Supabase (sometimes needed)
NOTIFY pgrst, 'reload schema';
