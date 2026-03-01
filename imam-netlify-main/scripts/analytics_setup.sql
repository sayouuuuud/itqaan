-- Create a table to track individual page visits for granular analytics
CREATE TABLE IF NOT EXISTS analytics_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  visitor_id TEXT, -- Hashed IP or cookie ID for unique visitor counting
  country TEXT DEFAULT 'Unknown',
  city TEXT,
  device_type TEXT DEFAULT 'desktop', -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  user_agent TEXT, -- Full user agent string
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_analytics_visits_created_at ON analytics_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_page_path ON analytics_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_device_type ON analytics_visits(device_type);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_country ON analytics_visits(country);

-- View for Daily Visits (for the main chart)
CREATE OR REPLACE VIEW analytics_daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as views_count,
  COUNT(DISTINCT visitor_id) as visitors_count
FROM analytics_visits
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for Top Pages (General)
CREATE OR REPLACE VIEW analytics_top_pages AS
SELECT 
  page_path,
  COUNT(*) as views
FROM analytics_visits
GROUP BY page_path
ORDER BY views DESC;

-- Function to get top content by period (Dynamic time filtering)
-- This will be handled by Supabase queries directly for flexibility:
-- e.g. .from('analytics_visits').select('page_path, count').gte('created_at', sevenDaysAgo).group('page_path')

-- Helper function to increment simple view counts on content tables (optional but good for sorting main lists)
-- Trigger example (concept): When a row is inserted in analytics_visits, update views_count on related sermon/lesson if path matches.
-- For now, we will rely on the analytics_visits table for the Dashboard charts.

-- Device Stats View
CREATE OR REPLACE VIEW analytics_device_stats AS
SELECT 
  device_type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM analytics_visits), 2) as percentage
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
