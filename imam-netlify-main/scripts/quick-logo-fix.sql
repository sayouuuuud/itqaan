-- Quick fix for logo issues - run this in Supabase SQL editor

-- Create appearance_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid PRIMARY KEY,
    site_logo_path text DEFAULT '/placeholder-logo.png',
    site_logo_path_dark text DEFAULT '/placeholder-logo.png',
    primary_color text DEFAULT '#1e4338',
    secondary_color text DEFAULT '#d4af37',
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default logo data
INSERT INTO public.appearance_settings (id, site_logo_path, site_logo_path_dark)
VALUES ('a0000000-0000-0000-0000-000000000001', '/placeholder-logo.png', '/placeholder-logo.png')
ON CONFLICT (id) DO UPDATE SET
    site_logo_path = '/placeholder-logo.png',
    site_logo_path_dark = '/placeholder-logo.png';

-- Also add to site_settings for backward compatibility
INSERT INTO public.site_settings (key, value)
VALUES ('site_logo', '/placeholder-logo.png')
ON CONFLICT (key) DO UPDATE SET value = '/placeholder-logo.png';







