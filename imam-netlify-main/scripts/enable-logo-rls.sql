-- Enable RLS with proper policies for logo functionality

-- Enable RLS
ALTER TABLE appearance_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read appearance_settings" ON appearance_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update appearance_settings" ON appearance_settings;

-- Create policies for public read access (since we want logo to be visible to everyone)
CREATE POLICY "Allow public read access to appearance_settings"
ON appearance_settings FOR SELECT
TO public
USING (true);

-- Allow authenticated users to update (for admin panel)
CREATE POLICY "Allow authenticated users to update appearance_settings"
ON appearance_settings FOR UPDATE
TO authenticated
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert appearance_settings"
ON appearance_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Test the permissions
SELECT * FROM appearance_settings LIMIT 1;







