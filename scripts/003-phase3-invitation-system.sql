-- Phase 3: نظام الدعوات
-- Invitation System for user onboarding into specific roles or courses

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Role assignment
  role_to_assign VARCHAR(50) NOT NULL,
  
  -- Optional course enrollment
  target_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED')),
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL,
  
  -- Tracking
  invited_by UUID NOT NULL REFERENCES users(id),
  accepted_at TIMESTAMP,
  accepted_by_user_id UUID REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_invitations_role ON invitations(role_to_assign);
CREATE INDEX IF NOT EXISTS idx_invitations_target_course_id ON invitations(target_course_id);

-- Step 3: Create invitation history table for audit trail
CREATE TABLE IF NOT EXISTS invitation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitation_history_invitation_id ON invitation_history(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_history_changed_at ON invitation_history(changed_at);

-- Step 4: Create function to generate unique invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN 'inv_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to auto-set expires_at to 7 days if not provided
CREATE OR REPLACE FUNCTION set_invitation_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := CURRENT_TIMESTAMP + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_invitation_expiry
BEFORE INSERT ON invitations
FOR EACH ROW
EXECUTE FUNCTION set_invitation_expiry();

-- Step 6: Create function to validate and consume invitation
-- This function will be called when a user accepts an invitation during registration
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token VARCHAR(255),
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_invitation invitations%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get the invitation
  SELECT * INTO v_invitation FROM invitations 
  WHERE token = p_token AND status = 'PENDING' LIMIT 1;
  
  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invitation not found or already used');
  END IF;
  
  -- Check if invitation has expired
  IF v_invitation.expires_at < CURRENT_TIMESTAMP THEN
    UPDATE invitations SET status = 'EXPIRED' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invitation has expired');
  END IF;
  
  -- Update invitation status to ACCEPTED
  UPDATE invitations 
  SET status = 'ACCEPTED', accepted_at = CURRENT_TIMESTAMP, accepted_by_user_id = p_user_id
  WHERE id = v_invitation.id;
  
  -- Log the change
  INSERT INTO invitation_history (invitation_id, previous_status, new_status, changed_by)
  VALUES (v_invitation.id, 'PENDING', 'ACCEPTED', p_user_id);
  
  -- If there's a target course, auto-enroll the user
  IF v_invitation.target_course_id IS NOT NULL THEN
    INSERT INTO enrollments (student_id, course_id, status)
    VALUES (p_user_id, v_invitation.target_course_id, 'ACTIVE')
    ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'ACTIVE';
  END IF;
  
  RETURN jsonb_build_object('success', TRUE, 'message', 'Invitation accepted successfully');
END;
$$ LANGUAGE plpgsql;

COMMIT;
