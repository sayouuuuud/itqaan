-- bandwidth_snapshots table
-- Stores periodic snapshots from Cloudinary API (every 15 minutes)

CREATE TABLE IF NOT EXISTS bandwidth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now(),
  total_limit BIGINT NOT NULL, -- Cloudinary limit in bytes
  total_used BIGINT NOT NULL, -- Total usage in bytes
  storage_used BIGINT DEFAULT 0, -- Storage portion in bytes
  bandwidth_used BIGINT DEFAULT 0, -- Bandwidth portion in bytes
  used_percent DECIMAL(5,2) DEFAULT 0,
  plan_name TEXT DEFAULT 'Free',
  api_response JSONB -- Full API response for debugging
);

-- Enable RLS
ALTER TABLE bandwidth_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on bandwidth_snapshots"
  ON bandwidth_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bandwidth_snapshots_timestamp ON bandwidth_snapshots(timestamp DESC);

-- Cleanup: Keep only last 30 days (optional function to run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_bandwidth_snapshots()
RETURNS void AS $$
BEGIN
  DELETE FROM bandwidth_snapshots
  WHERE timestamp < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
