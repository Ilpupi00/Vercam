-- migrations/001_init.sql
-- DDL iniziale per PostgreSQL: users, emails, documents
-- Requisiti: eseguire contro il database `vercam` (created with db/create_db.sql)

-- NOTE: Requires superuser to create extension. If you cannot create extensions,
-- remove the CREATE EXTENSION line and adjust UUID defaults.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users ((lower(email)));

-- Emails
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  message_id TEXT UNIQUE,
  from_addr TEXT,
  to_addrs JSONB,
  cc_addrs JSONB,
  bcc_addrs JSONB,
  subject TEXT,
  body TEXT,
  attachments JSONB DEFAULT '[]',
  headers JSONB DEFAULT '{}',
  is_inbound BOOLEAN DEFAULT TRUE,
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Full-text search vector (subject + body). Adjust language if you prefer.
ALTER TABLE emails ADD COLUMN IF NOT EXISTS search_tsv tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('italian', coalesce(subject,'')), 'A') ||
  setweight(to_tsvector('italian', coalesce(body,'')), 'B')
) STORED;

CREATE INDEX IF NOT EXISTS idx_emails_search_tsv ON emails USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_emails_owner_created ON emails (owner_user_id, created_at);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  storage_provider TEXT NOT NULL DEFAULT 's3',
  storage_path TEXT NOT NULL,
  checksum TEXT,
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_checksum ON documents (checksum);

-- Optional: table for soft-deletes / audit could be added later.

-- Example insert (remove/comment out in production):
-- INSERT INTO users (email, password_hash, full_name) VALUES ('demo@example.com', 'changeme-hash', 'Demo User');
