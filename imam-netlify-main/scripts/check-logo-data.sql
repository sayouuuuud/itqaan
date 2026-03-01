-- Check current logo data in database

-- Check appearance_settings
SELECT 'appearance_settings' as table_name, site_logo_path, site_logo_path_dark, updated_at
FROM appearance_settings
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Check site_settings
SELECT 'site_settings' as table_name, key, value, updated_at
FROM site_settings
WHERE key = 'site_logo_path' OR key = 'site_logo';







