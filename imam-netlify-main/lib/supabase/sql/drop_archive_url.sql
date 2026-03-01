-- ⚠️ WARNING: Run this ONLY after you have finished migration AND cleanup.
-- This will remove the 'archive_url' column. 
-- If you haven't run the cleanup tool yet, the old files will remain on Cloudinary forever (orphaned).

ALTER TABLE books DROP COLUMN IF EXISTS archive_url;
