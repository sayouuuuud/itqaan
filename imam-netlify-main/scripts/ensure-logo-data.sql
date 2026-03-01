-- Ensure appearance_settings table exists and has logo data
CREATE TABLE IF NOT EXISTS public.appearance_settings (
    id uuid DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid NOT NULL,
    primary_color character varying(20) DEFAULT '#1e4338'::character varying,
    secondary_color character varying(20) DEFAULT '#d4af37'::character varying,
    dark_mode_enabled boolean DEFAULT true,
    show_hijri_date boolean DEFAULT true,
    site_logo_path text DEFAULT '/placeholder-logo.png'::text,
    site_logo_path_dark text DEFAULT '/placeholder-logo.png'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insert or update logo settings
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

-- Also ensure site_settings has the logo for backward compatibility
INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('site_logo_path', '/placeholder-logo.png', now())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();







