-- Enable RLS on tables where it is disabled but policies exist or it's public
ALTER TABLE IF EXISTS public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bandwidth_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings ENABLE ROW LEVEL SECURITY;

-- Change views to use security_invoker = true
-- This ensures they respect the RLS of the user querying them, rather than the creator.
ALTER VIEW IF EXISTS public.analytics_daily_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.analytics_device_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.analytics_country_stats SET (security_invoker = true);
ALTER VIEW IF EXISTS public.analytics_top_pages SET (security_invoker = true);
