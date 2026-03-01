-- Quick fix for logo issues - Copy and paste this in Supabase SQL Editor

-- Create table (if not exists)
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid PRIMARY KEY,
    site_logo_path text DEFAULT '/placeholder-logo.png',
    site_logo_path_dark text DEFAULT '/placeholder-logo.png',
    primary_color text DEFAULT '#1e4338',
    secondary_color text DEFAULT '#d4af37',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert default data
INSERT INTO public.appearance_settings (id, site_logo_path, site_logo_path_dark)
VALUES ('a0000000-0000-0000-0000-000000000001', '/placeholder-logo.png', '/placeholder-logo.png')
ON CONFLICT (id) DO NOTHING;

-- Disable RLS temporarily for testing
ALTER TABLE public.appearance_settings DISABLE ROW LEVEL SECURITY;

-- Check current data
SELECT * FROM public.appearance_settings WHERE id = 'a0000000-0000-0000-0000-000000000001';







