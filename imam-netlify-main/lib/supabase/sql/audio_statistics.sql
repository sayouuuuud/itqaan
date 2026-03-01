-- audio_statistics table
-- Tracks all audio-related bandwidth consumption (downloads and streams)

CREATE TABLE IF NOT EXISTS audio_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id UUID NOT NULL, -- FK to lessons or sermons (polymorphic)
  audio_type TEXT NOT NULL CHECK (audio_type IN ('lesson', 'sermon')),
  action_type TEXT NOT NULL CHECK (action_type IN ('download', 'stream')),
  duration_listened INTEGER, -- Seconds, only for 'stream' action
  bandwidth_consumed BIGINT NOT NULL DEFAULT 0, -- Bytes
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE audio_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (admin-only, no user auth)
CREATE POLICY "Allow all operations on audio_statistics"
  ON audio_statistics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audio_statistics_audio_id ON audio_statistics(audio_id);
CREATE INDEX IF NOT EXISTS idx_audio_statistics_audio_type ON audio_statistics(audio_type);
CREATE INDEX IF NOT EXISTS idx_audio_statistics_action_type ON audio_statistics(action_type);
CREATE INDEX IF NOT EXISTS idx_audio_statistics_created_at ON audio_statistics(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_statistics_created_at_action ON audio_statistics(created_at, action_type);
