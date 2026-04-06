-- Phase 1: Better Auth Database Migration
-- Integrating Better Auth with existing users table
-- DO NOT DROP OR MODIFY existing users table

-- Step 1: Add missing Better Auth columns to existing users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Create Better Auth session table
CREATE TABLE IF NOT EXISTS session (
  id VARCHAR(255) PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session("expiresAt");

-- Step 3: Create Better Auth account table (for OAuth/social logins)
CREATE TABLE IF NOT EXISTS account (
  id VARCHAR(255) PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  "refreshToken" TEXT,
  "accessToken" TEXT,
  "expiresAt" BIGINT,
  "tokenType" VARCHAR(255),
  scope TEXT,
  "idToken" TEXT,
  "sessionState" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_user_id ON account("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider ON account(provider, "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS idx_account_unique ON account("userId", provider, "providerAccountId");

-- Step 4: Create Better Auth verification token table
CREATE TABLE IF NOT EXISTS "verificationToken" (
  token VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_token_email ON "verificationToken"(email);
CREATE INDEX IF NOT EXISTS idx_verification_token_expires_at ON "verificationToken"("expiresAt");

-- Step 5: Create update trigger for users table updatedAt
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Step 6: Create update trigger for session table updatedAt
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_session_updated_at
BEFORE UPDATE ON session
FOR EACH ROW
EXECUTE FUNCTION update_session_updated_at();

-- Step 7: Create update trigger for account table updatedAt
CREATE OR REPLACE FUNCTION update_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_account_updated_at
BEFORE UPDATE ON account
FOR EACH ROW
EXECUTE FUNCTION update_account_updated_at();

COMMIT;
