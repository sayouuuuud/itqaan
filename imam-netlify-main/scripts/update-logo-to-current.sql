-- Update logo to the current uploaded image

UPDATE appearance_settings
SET site_logo_path = 'uploads/logo/1767922036492-xei7zw-Screenshot_2026-01-08_071838-Photoroom.png',
    site_logo_path_dark = 'uploads/logo/1767922036492-xei7zw-Screenshot_2026-01-08_071838-Photoroom.png',
    updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE site_settings
SET value = 'uploads/logo/1767922036492-xei7zw-Screenshot_2026-01-08_071838-Photoroom.png',
    updated_at = now()
WHERE key = 'site_logo';

-- Verify the update
SELECT * FROM appearance_settings WHERE id = 'a0000000-0000-0000-0000-000000000001';







