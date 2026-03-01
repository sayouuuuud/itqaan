-- Reset logo to placeholder for testing

UPDATE appearance_settings
SET site_logo_path = '/placeholder-logo.png',
    site_logo_path_dark = '/placeholder-logo.png',
    updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE site_settings
SET value = '/placeholder-logo.png',
    updated_at = now()
WHERE key = 'site_logo';







