-- Phase 4: ربط ولي الأمر بالطالب
-- Parent-Student Relations Table

CREATE TABLE IF NOT EXISTS parent_student_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Relationship metadata
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('FATHER', 'MOTHER', 'GUARDIAN', 'OTHER')),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(parent_id, student_id)
);

-- Step 2: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id ON parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_is_active ON parent_student_links(is_active);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_verified ON parent_student_links(verified);

-- Step 3: Create composite index for finding all students of a parent
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_active 
ON parent_student_links(parent_id, is_active) 
WHERE is_active = TRUE;

-- Step 4: Create trigger to validate parent has PARENT role
CREATE OR REPLACE FUNCTION validate_parent_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.parent_id AND role = 'PARENT') THEN
    RAISE EXCEPTION 'parent_id must have PARENT role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_parent_role
BEFORE INSERT OR UPDATE ON parent_student_links
FOR EACH ROW
EXECUTE FUNCTION validate_parent_role();

-- Step 5: Create trigger to validate student has STUDENT role
CREATE OR REPLACE FUNCTION validate_student_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.student_id AND role = 'STUDENT') THEN
    RAISE EXCEPTION 'student_id must have STUDENT role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_student_role
BEFORE INSERT OR UPDATE ON parent_student_links
FOR EACH ROW
EXECUTE FUNCTION validate_student_role();

-- Step 6: Create function to get parent's students
CREATE OR REPLACE FUNCTION get_parent_students(p_parent_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  student_email VARCHAR,
  student_gender VARCHAR,
  relationship_type VARCHAR,
  verified BOOLEAN,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    u.gender,
    psl.relationship_type,
    psl.verified,
    psl.created_at
  FROM parent_student_links psl
  JOIN users u ON psl.student_id = u.id
  WHERE psl.parent_id = p_parent_id 
    AND psl.is_active = TRUE
  ORDER BY psl.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to get student's parents
CREATE OR REPLACE FUNCTION get_student_parents(p_student_id UUID)
RETURNS TABLE (
  parent_id UUID,
  parent_name VARCHAR,
  parent_email VARCHAR,
  relationship_type VARCHAR,
  verified BOOLEAN,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    psl.relationship_type,
    psl.verified,
    psl.created_at
  FROM parent_student_links psl
  JOIN users u ON psl.parent_id = u.id
  WHERE psl.student_id = p_student_id 
    AND psl.is_active = TRUE
  ORDER BY psl.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create audit table for tracking parent-student link changes
CREATE TABLE IF NOT EXISTS parent_student_link_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_student_link_id UUID REFERENCES parent_student_links(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATED', 'VERIFIED', 'UNLINKED', 'ACTIVATED', 'DEACTIVATED')),
  performed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parent_student_link_audit_link_id ON parent_student_link_audit(parent_student_link_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_link_audit_created_at ON parent_student_link_audit(created_at);

COMMIT;
