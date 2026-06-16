-- Migration 011: Initiatives module (Phase 1)
-- Adds the initiatives table and links users/recitations to an initiative.
-- All initiative_id columns are NULLABLE so existing individual users are unaffected (NULL = independent user).

CREATE TABLE IF NOT EXISTS initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  type varchar(50),                         -- university | ministry | restaurant | cafe | other
  description text,
  logo_url text,
  contact_name varchar(255),
  contact_email varchar(255),
  contact_phone varchar(50),
  target_students_count integer,
  status varchar(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','suspended')),
  admin_user_id uuid REFERENCES users(id),  -- provisioned Initiative Admin (null until approved)
  rejection_reason text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_admin_user_id ON initiatives(admin_user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS initiative_id uuid REFERENCES initiatives(id);
ALTER TABLE recitations ADD COLUMN IF NOT EXISTS initiative_id uuid REFERENCES initiatives(id);

CREATE INDEX IF NOT EXISTS idx_users_initiative_id ON users(initiative_id);
CREATE INDEX IF NOT EXISTS idx_recitations_initiative_id ON recitations(initiative_id);
