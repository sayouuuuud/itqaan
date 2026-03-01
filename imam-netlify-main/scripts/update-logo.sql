-- Update logo settings in appearance_settings table
UPDATE public.appearance_settings
SET
  site_logo_path = '/placeholder-logo.png',
  site_logo_path_dark = '/placeholder-logo.png',
  updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- If no record exists, insert one
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







