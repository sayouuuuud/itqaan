-- =============================================
-- Migration V6 – Certificate Data Enhancement
-- Add phone and age fields to certificate_data
-- =============================================

ALTER TABLE certificate_data ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE certificate_data ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE certificate_data ADD COLUMN IF NOT EXISTS entity_other VARCHAR(255);

COMMENT ON COLUMN certificate_data.phone IS 'Mobile number for student communication';
COMMENT ON COLUMN certificate_data.age IS 'Student age for platform statistics';
COMMENT ON COLUMN certificate_data.entity_other IS 'Custom authorized entity name';
