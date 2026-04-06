-- Phase 5: Better Auth Schema Integration
-- Adds better-auth compatible columns and ensures compatibility with LMS schema

-- Add better-auth required columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS emailVerified TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS twoFactorEnabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS image VARCHAR(255) DEFAULT NULL;

-- Create better_auth_accounts table (better-auth will also do this but we ensure it exists)
-- This table stores OAuth connections and other auth provider data
CREATE TABLE IF NOT EXISTS better_auth_accounts (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accountId VARCHAR(255) NOT NULL,
  providerId VARCHAR(255) NOT NULL,
  providerAccountId VARCHAR(255) NOT NULL,
  refreshToken TEXT DEFAULT NULL,
  accessToken TEXT DEFAULT NULL,
  expiresAt BIGINT DEFAULT NULL,
  password VARCHAR(255) DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(providerId, providerAccountId)
);

-- Create better_auth_sessions table
CREATE TABLE IF NOT EXISTS better_auth_sessions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt TIMESTAMP NOT NULL,
  ipAddress VARCHAR(45) DEFAULT NULL,
  userAgent TEXT DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create better_auth_verifications table (for email verification, password reset, etc.)
CREATE TABLE IF NOT EXISTS better_auth_verifications (
  id VARCHAR(255) PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_better_auth_accounts_userId ON better_auth_accounts(userId);
CREATE INDEX IF NOT EXISTS idx_better_auth_accounts_providerId ON better_auth_accounts(providerId, providerAccountId);
CREATE INDEX IF NOT EXISTS idx_better_auth_sessions_userId ON better_auth_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_better_auth_sessions_expiresAt ON better_auth_sessions(expiresAt);
CREATE INDEX IF NOT EXISTS idx_better_auth_verifications_identifier ON better_auth_verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_better_auth_verifications_expiresAt ON better_auth_verifications(expiresAt);

-- Update existing user records to have verified emails if they already had accounts
UPDATE users 
SET emailVerified = CURRENT_TIMESTAMP 
WHERE emailVerified IS NULL AND email IS NOT NULL;

-- Create a view that combines auth info with LMS user info
CREATE OR REPLACE VIEW user_auth_info AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.gender,
  u.phone,
  u.dateOfBirth,
  u.emailVerified,
  u.twoFactorEnabled,
  u.image,
  u.createdAt,
  u.updatedAt,
  COUNT(DISTINCT ba.id) as authProvidersCount,
  COUNT(DISTINCT bs.id) as activeSessions
FROM users u
LEFT JOIN better_auth_accounts ba ON u.id = ba.userId
LEFT JOIN better_auth_sessions bs ON u.id = bs.userId AND bs.expiresAt > NOW()
GROUP BY u.id, u.email, u.name, u.role, u.gender, u.phone, u.dateOfBirth, u.emailVerified, u.twoFactorEnabled, u.image, u.createdAt, u.updatedAt;

-- Add audit logging for auth events
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  eventType VARCHAR(50) NOT NULL, -- login, logout, sign_up, password_change, 2fa_enabled, etc.
  ipAddress VARCHAR(45),
  userAgent TEXT,
  status VARCHAR(20) DEFAULT 'success', -- success, failed
  details JSONB DEFAULT '{}',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_log_userId ON auth_audit_log(userId);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_eventType ON auth_audit_log(eventType);
CREATE INDEX IF NOT EXISTS idx_auth_audit_log_createdAt ON auth_audit_log(createdAt);
