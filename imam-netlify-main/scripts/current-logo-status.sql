-- Check current logo status in database

SELECT
    'appearance_settings' as source,
    site_logo_path as logo_path,
    updated_at
FROM appearance_settings
WHERE id = 'a0000000-0000-0000-0000-000000000001'

UNION ALL

SELECT
    'site_settings' as source,
    value as logo_path,
    updated_at
FROM site_settings
WHERE key = 'site_logo'

ORDER BY updated_at DESC;







