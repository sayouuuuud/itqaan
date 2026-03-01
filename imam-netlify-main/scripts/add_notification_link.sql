-- Add link column to notifications table (if not already exists)
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link character varying(500);

-- Add source_id and source_type columns for better tracking (if not already exist)
-- Note: source_id is already UUID in the schema, so we don't need to add it again

-- Update existing notifications to have proper source_id for contact messages
UPDATE public.notifications
SET source_id = substring(link from 'id=([^&]+)')::uuid,
    source_type = 'contact_message'
WHERE link LIKE '%/admin/contact-form?id=%'
AND (source_id IS NULL OR source_type IS NULL);
