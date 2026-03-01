-- Create appearance_settings table in Supabase
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid PRIMARY KEY,
    primary_color character varying(20) DEFAULT '#1e4338'::character varying,
    secondary_color character varying(20) DEFAULT '#d4af37'::character varying,
    dark_mode_enabled boolean DEFAULT true,
    show_hijri_date boolean DEFAULT true,
    site_logo_path text DEFAULT '/placeholder-logo.png'::text,
    site_logo_path_dark text DEFAULT '/placeholder-logo.png'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default settings
INSERT INTO public.appearance_settings (
    id,
    primary_color,
    secondary_color,
    site_logo_path,
    site_logo_path_dark,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '#1e4338',
    '#d4af37',
    '/placeholder-logo.png',
    '/placeholder-logo.png',
    now()
) ON CONFLICT (id) DO UPDATE SET
    site_logo_path = EXCLUDED.site_logo_path,
    site_logo_path_dark = EXCLUDED.site_logo_path_dark,
    updated_at = now();

-- Create site_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key character varying(255) UNIQUE NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default logo in site_settings
INSERT INTO public.site_settings (key, value)
VALUES ('site_logo_path', '/placeholder-logo.png')
ON CONFLICT (key) DO UPDATE SET
    value = '/placeholder-logo.png',
    updated_at = now();

-- Enable RLS (Row Level Security) - DISABLED for testing
-- ALTER TABLE public.appearance_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS for testing
ALTER TABLE public.appearance_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings DISABLE ROW LEVEL SECURITY;
