-- Add dark mode logo field to appearance_settings table
ALTER TABLE public.appearance_settings 
ADD COLUMN IF NOT EXISTS site_logo_path_dark text DEFAULT ''::text;

-- Update existing records to have empty dark logo path
UPDATE public.appearance_settings 
SET site_logo_path_dark = '' 
WHERE site_logo_path_dark IS NULL;

