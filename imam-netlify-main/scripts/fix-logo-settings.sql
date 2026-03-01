-- Fix logo settings - ensure appearance_settings has logo data
-- This will insert default logo settings if they don't exist

INSERT INTO public.appearance_settings (
    id,
    primary_color,
    secondary_color,
    site_logo_path,
    site_logo_path_dark,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '#1e4338',
    '#d4af37',
    '/placeholder-logo.png',
    '/placeholder-logo.png',
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    site_logo_path = EXCLUDED.site_logo_path,
    site_logo_path_dark = EXCLUDED.site_logo_path_dark,
    updated_at = now();

-- Also update site_settings for backward compatibility
INSERT INTO public.site_settings (key, value, updated_at)
VALUES ('site_logo_path', '/placeholder-logo.png', now())
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();
