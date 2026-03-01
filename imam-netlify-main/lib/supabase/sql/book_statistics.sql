-- book_statistics table
-- Tracks all book-related bandwidth consumption (downloads and views)

CREATE TABLE IF NOT EXISTS book_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('download', 'view')),
  pages_viewed INTEGER, -- Only for 'view' action
  bandwidth_consumed BIGINT NOT NULL DEFAULT 0, -- Bytes
  user_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE book_statistics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations (admin-only, no user auth)
CREATE POLICY "Allow all operations on book_statistics"
  ON book_statistics
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_statistics_book_id ON book_statistics(book_id);
CREATE INDEX IF NOT EXISTS idx_book_statistics_action_type ON book_statistics(action_type);
CREATE INDEX IF NOT EXISTS idx_book_statistics_created_at ON book_statistics(created_at);
CREATE INDEX IF NOT EXISTS idx_book_statistics_created_at_action ON book_statistics(created_at, action_type);
