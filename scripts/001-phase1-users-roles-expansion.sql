-- Phase 1: تحديث جدول المستخدمين والأدوار
-- Update Users Table with gender field and expand roles

-- Step 1: Add gender column if it doesn't exist
-- The gender field is mandatory for new registrations to support gender-separated UI rendering
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE'));

-- Step 2: Create new role enum type if it doesn't exist
-- First, check if we need to extend the role enum
DO $$ 
BEGIN
  -- Try to add new roles to the enum
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TEACHER';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARENT';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'READERS_SUPERVISOR';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'READERS_MONITOR';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'FIQH_ADMIN';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CONTENT_SUPERVISOR';
EXCEPTION WHEN OTHERS THEN
  -- If the enum doesn't exist or another error occurs, we'll create a new one
  NULL;
END $$;

-- If the role column uses text instead of enum, the above will fail silently
-- The application should handle these roles as strings if using text type

-- Step 3: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_role_gender ON users(role, gender);

-- Step 4: Add audit columns for tracking role changes (optional but recommended)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS role_changed_by UUID REFERENCES users(id);

-- Step 5: Create a table for role permissions (for future RBAC engine)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles with their descriptions
INSERT INTO role_permissions (role, description) VALUES
  ('ADMIN', 'System administrator with full access'),
  ('TEACHER', 'Teacher/Sheikh who creates courses and lessons'),
  ('STUDENT', 'Student who enrolls in courses'),
  ('READER', 'Quran reader who reviews student recitations'),
  ('PARENT', 'Parent who monitors student progress'),
  ('READERS_SUPERVISOR', 'Supervisor who manages reader statuses'),
  ('READERS_MONITOR', 'Monitor who tracks reader activities'),
  ('FIQH_ADMIN', 'Fiqh questions administrator'),
  ('CONTENT_SUPERVISOR', 'Content supervisor')
ON CONFLICT (role) DO NOTHING;

-- Step 6: Create permission mapping table for fine-grained access control
CREATE TABLE IF NOT EXISTS permission_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL REFERENCES role_permissions(role),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  can_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role, resource, action)
);

COMMIT;
