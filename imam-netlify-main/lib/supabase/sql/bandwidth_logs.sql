-- bandwidth_logs table
-- Comprehensive logging of all bandwidth-related operations

CREATE TABLE IF NOT EXISTS bandwidth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL CHECK (log_type IN (
    'download', 'view', 'stream', 
    'limit_exceeded', 'api_call', 'error', 
    'rate_limit', 'setting_change'
  )),
  resource_type TEXT CHECK (resource_type IN ('book', 'audio', 'system')),
  resource_id UUID, -- FK to books/lessons/sermons
  bandwidth_consumed BIGINT DEFAULT 0, -- Bytes
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB, -- Additional context (e.g., limit name, setting values)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bandwidth_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations
CREATE POLICY "Allow all operations on bandwidth_logs"
  ON bandwidth_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_type ON bandwidth_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_resource ON bandwidth_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_created_at ON bandwidth_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_success ON bandwidth_logs(success);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_ip ON bandwidth_logs(ip_address);

-- Cleanup: Keep only last 90 days
CREATE OR REPLACE FUNCTION cleanup_old_bandwidth_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM bandwidth_logs
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
