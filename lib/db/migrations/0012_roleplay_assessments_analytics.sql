-- 0012_roleplay_assessments_analytics.sql
-- Stream B / pass (2): roleplay, assessments, analytics, usage, agreements,
-- chat, site settings, and Replit auth session tables that previously existed
-- only via drizzle-kit push.
--
-- Safe to re-run: CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
-- Source of truth: lib/db/src/schema/schema.ts + chat.ts
-- After this file, product tables in lib/db are recoverable via migrate alone
-- (sales_workflow remains lib/hospice-sales-runtime).

-- ── Replit Auth (legacy blueprint tables) ────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ── Usage / rate limits / upload tokens ──────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
  id serial PRIMARY KEY,
  name varchar NOT NULL,
  email text NOT NULL,
  tool_name varchar NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_usage_daily (
  date varchar(10) PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_usage_daily (
  date varchar(10) PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS object_upload_tokens (
  token varchar(36) PRIMARY KEY,
  expires_at timestamp NOT NULL
);

-- ── Agreements ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signed_agreements (
  id serial PRIMARY KEY,
  agreement_type varchar NOT NULL,
  signer_name varchar NOT NULL,
  signer_title varchar NOT NULL,
  signer_organization varchar NOT NULL,
  signer_email text NOT NULL,
  signature_image text,
  pdf_data text,
  request_id integer,
  signed_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agreement_requests (
  id serial PRIMARY KEY,
  recipient_email text NOT NULL,
  recipient_name varchar NOT NULL,
  document_types text[] NOT NULL,
  token varchar NOT NULL UNIQUE,
  status varchar NOT NULL DEFAULT 'pending',
  sent_at timestamp DEFAULT now(),
  completed_at timestamp
);

-- ── Visitor + product analytics ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitors (
  id serial PRIMARY KEY,
  page_path text NOT NULL,
  visited_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS event_tracking (
  id serial PRIMARY KEY,
  event_type text NOT NULL,
  event_name text NOT NULL,
  metadata text,
  created_at bigint NOT NULL,
  member_id integer
);
ALTER TABLE event_tracking ADD COLUMN IF NOT EXISTS member_id integer;

CREATE INDEX IF NOT EXISTS event_tracking_type_name_idx
  ON event_tracking (event_type, event_name);
CREATE INDEX IF NOT EXISTS event_tracking_member_idx
  ON event_tracking (member_id);

-- ── Role-play + drills ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roleplay_sessions (
  id serial PRIMARY KEY,
  member_id integer,
  organization_id integer,
  scenario_id text NOT NULL,
  scenario_title text NOT NULL,
  scenario_description text,
  status text NOT NULL DEFAULT 'active',
  feedback text,
  rating integer,
  created_at bigint NOT NULL
);
ALTER TABLE roleplay_sessions ADD COLUMN IF NOT EXISTS member_id integer;
ALTER TABLE roleplay_sessions ADD COLUMN IF NOT EXISTS organization_id integer;

CREATE INDEX IF NOT EXISTS "IDX_roleplay_sessions_member" ON roleplay_sessions (member_id);
CREATE INDEX IF NOT EXISTS "IDX_roleplay_sessions_org" ON roleplay_sessions (organization_id);

CREATE TABLE IF NOT EXISTS roleplay_messages (
  id serial PRIMARY KEY,
  session_id integer NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS drill_completions (
  id serial PRIMARY KEY,
  drill_index integer NOT NULL,
  drill_title text NOT NULL,
  notes text,
  completed_at bigint NOT NULL,
  member_id integer,
  organization_id integer
);
ALTER TABLE drill_completions ADD COLUMN IF NOT EXISTS member_id integer;
ALTER TABLE drill_completions ADD COLUMN IF NOT EXISTS organization_id integer;

-- ── Assessments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id serial PRIMARY KEY,
  name varchar NOT NULL,
  description text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id serial PRIMARY KEY,
  assessment_id integer NOT NULL,
  type varchar NOT NULL,
  text text NOT NULL,
  options text[],
  correct_answer text,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assessment_clients (
  id serial PRIMARY KEY,
  slug varchar(100) NOT NULL UNIQUE,
  company_name varchar NOT NULL,
  logo_url text,
  accent_color varchar(20),
  assessment_id integer NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_submissions (
  id serial PRIMARY KEY,
  assessment_id integer NOT NULL,
  candidate_name varchar NOT NULL,
  candidate_email text NOT NULL,
  answers jsonb NOT NULL,
  quiz_score integer,
  ai_score integer,
  overall_score integer,
  ai_feedback text,
  client_slug varchar(100),
  completed_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_invites (
  id serial PRIMARY KEY,
  assessment_id integer NOT NULL,
  token varchar NOT NULL UNIQUE,
  candidate_email text NOT NULL,
  candidate_name varchar NOT NULL,
  sent_at timestamp DEFAULT now(),
  used_at timestamp
);

-- ── Site settings ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key varchar(255) PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamp DEFAULT now()
);

-- ── Legacy chat (conversations / messages) ───────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id serial PRIMARY KEY,
  title text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id serial PRIMARY KEY,
  conversation_id integer NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
