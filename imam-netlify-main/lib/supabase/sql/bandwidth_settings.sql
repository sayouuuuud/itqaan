-- bandwidth_settings table
-- Stores custom bandwidth limits (daily, weekly, monthly, per-content-type)

CREATE TABLE IF NOT EXISTS bandwidth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_type TEXT NOT NULL UNIQUE,
  -- Types: daily, weekly, monthly, book_view, book_download, audio_stream, audio_download
  is_enabled BOOLEAN DEFAULT false,
  limit_value BIGINT NOT NULL DEFAULT 0, -- Stored in Bytes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE bandwidth_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (admin-only table, no user auth in this site)
CREATE POLICY "Allow all operations on bandwidth_settings"
  ON bandwidth_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bandwidth_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bandwidth_settings_updated_at
  BEFORE UPDATE ON bandwidth_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_bandwidth_settings_updated_at();

-- Seed default values (5 GB = 5368709120 bytes)
INSERT INTO bandwidth_settings (setting_type, is_enabled, limit_value) VALUES
  ('daily', false, 5368709120),
  ('weekly', false, 21474836480),
  ('monthly', false, 26843545600),
  ('book_view', false, 10737418240),
  ('book_download', false, 10737418240),
  ('audio_stream', false, 5368709120),
  ('audio_download', false, 5368709120)
ON CONFLICT (setting_type) DO NOTHING;
