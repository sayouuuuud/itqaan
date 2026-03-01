-- Emergency logo fix - Run this in Supabase SQL Editor

-- Step 1: Check if table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'appearance_settings';

-- Step 2: Create table if not exists
CREATE TABLE IF NOT EXISTS appearance_settings (
    id uuid PRIMARY KEY DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid,
    site_logo_path text,
    site_logo_path_dark text,
    primary_color text DEFAULT '#1e4338',
    secondary_color text DEFAULT '#d4af37',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Step 3: Disable RLS
ALTER TABLE appearance_settings DISABLE ROW LEVEL SECURITY;

-- Step 4: Insert/Update logo data
INSERT INTO appearance_settings (id, site_logo_path, site_logo_path_dark, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', '/placeholder-logo.png', '/placeholder-logo.png', now())
ON CONFLICT (id) DO UPDATE SET
    site_logo_path = EXCLUDED.site_logo_path,
    site_logo_path_dark = EXCLUDED.site_logo_path_dark,
    updated_at = now();

-- Step 5: Verify data
SELECT * FROM appearance_settings WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Step 6: Test permissions (run as authenticated user)
-- SELECT * FROM appearance_settings LIMIT 1;







