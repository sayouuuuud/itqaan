-- Run this script in Supabase SQL Editor to set up analytics for the dashboard

-- ============================================
-- STEP 1: Create the analytics_visits table
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  visitor_id TEXT,
  country TEXT DEFAULT 'Unknown',
  city TEXT,
  device_type TEXT DEFAULT 'desktop',
  browser TEXT,
  os TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_agent column if it doesn't exist (for existing tables)
ALTER TABLE analytics_visits ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON analytics_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_page_path ON analytics_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_device_type ON analytics_visits(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_country ON analytics_visits(country);

-- ============================================
-- STEP 3: Create Views for Dashboard
-- ============================================

-- Daily Stats View (for the main chart)
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as views_count,
  COUNT(DISTINCT visitor_id) as visitors_count
FROM analytics_visits
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top Pages View
CREATE OR REPLACE VIEW analytics_top_pages AS
SELECT 
  page_path,
  COUNT(*) as views
FROM analytics_visits
GROUP BY page_path
ORDER BY views DESC;

-- Device Stats View
CREATE OR REPLACE VIEW analytics_device_stats AS
SELECT 
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM analytics_visits), 0), 2) as percentage
FROM analytics_visits
GROUP BY device_type;

-- Country Stats View
CREATE OR REPLACE VIEW analytics_country_stats AS
SELECT 
  country,
  COUNT(*) as count
FROM analytics_visits
GROUP BY country
ORDER BY count DESC
LIMIT 20;

-- ============================================
-- STEP 4: Enable RLS (Row Level Security)
-- ============================================
ALTER TABLE analytics_visits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT (for tracking)
CREATE POLICY IF NOT EXISTS "Allow anonymous insert" ON analytics_visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to SELECT (for admin dashboard)
CREATE POLICY IF NOT EXISTS "Allow authenticated select" ON analytics_visits
  FOR SELECT TO authenticated
  USING (true);

-- ============================================
-- Done! The analytics will now work.
-- ============================================
