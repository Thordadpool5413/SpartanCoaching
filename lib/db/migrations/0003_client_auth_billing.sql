-- 0003_client_auth_billing.sql
-- Baseline for product auth + billing columns on client_organizations.
-- Safe to re-run: CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
-- Source of truth remains Drizzle: lib/db/src/schema/auth.ts
-- Apply after pull when not using drizzle-kit push alone:
--   psql "$DATABASE_URL" -f lib/db/migrations/0003_client_auth_billing.sql
-- Or: node artifacts/api-server/scripts/apply-sql-migration.mjs 0003_client_auth_billing.sql
-- (if that helper is present; otherwise use push for parity with CI)

-- ── Organizations (tenant + billing) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS client_organizations (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  type varchar(32) NOT NULL DEFAULT 'personal',
  seat_limit integer NOT NULL DEFAULT 1,
  status varchar(32) NOT NULL DEFAULT 'trial',
  pipeline_status varchar(32) NOT NULL DEFAULT 'trial',
  trial_ends_at timestamp,
  activated_at timestamp,
  next_follow_up_at timestamp,
  lost_reason text,
  notes text,
  billing_plan varchar(64),
  billing_status varchar(64),
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  stripe_price_id varchar(255),
  current_period_end timestamp,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  contract_unit_amount_cents integer,
  contract_currency varchar(8) DEFAULT 'usd',
  contract_ref varchar(128),
  billable_seats integer,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Columns that may have been added after first create (push-era drift)
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS pipeline_status varchar(32) NOT NULL DEFAULT 'trial';
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS trial_ends_at timestamp;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS activated_at timestamp;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS next_follow_up_at timestamp;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS billing_plan varchar(64);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS billing_status varchar(64);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(255);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id varchar(255);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS stripe_price_id varchar(255);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS current_period_end timestamp;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS contract_unit_amount_cents integer;
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS contract_currency varchar(8) DEFAULT 'usd';
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS contract_ref varchar(128);
ALTER TABLE client_organizations ADD COLUMN IF NOT EXISTS billable_seats integer;

-- ── Org timeline ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_timeline_events (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  type varchar(64) NOT NULL,
  body text NOT NULL,
  meta jsonb,
  created_by varchar(128),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_org_timeline_org" ON org_timeline_events (organization_id);

-- ── Members ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_members (
  id serial PRIMARY KEY,
  email varchar(320) NOT NULL UNIQUE,
  password_hash text,
  name varchar(255) NOT NULL,
  title varchar(255),
  role varchar(32) NOT NULL DEFAULT 'member',
  organization_id integer NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'invited',
  job_role varchar(64),
  territory_note text,
  top_objections text,
  checklist_progress jsonb DEFAULT '{}'::jsonb,
  onboarding_started_at timestamp,
  terms_accepted_at timestamp,
  last_login_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_client_members_org" ON client_members (organization_id);

ALTER TABLE client_members ADD COLUMN IF NOT EXISTS job_role varchar(64);
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS territory_note text;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS top_objections text;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS checklist_progress jsonb DEFAULT '{}'::jsonb;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS onboarding_started_at timestamp;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp;
ALTER TABLE client_members ADD COLUMN IF NOT EXISTS last_login_at timestamp;

-- ── Sessions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_sessions (
  id serial PRIMARY KEY,
  member_id integer NOT NULL,
  token_hash varchar(128) NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  user_agent text,
  mfa_verified_at timestamptz,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_client_sessions_member" ON client_sessions (member_id);
CREATE INDEX IF NOT EXISTS "IDX_client_sessions_expires" ON client_sessions (expires_at);
ALTER TABLE client_sessions ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz;

-- ── Access requests ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_requests (
  id serial PRIMARY KEY,
  type varchar(32) NOT NULL DEFAULT 'individual',
  name varchar(255) NOT NULL,
  email varchar(320) NOT NULL,
  company_name varchar(255),
  job_title varchar(255),
  role varchar(64),
  team_size varchar(64),
  primary_goal varchar(128),
  market varchar(255),
  message text,
  seats_requested integer DEFAULT 1,
  status varchar(32) NOT NULL DEFAULT 'pending',
  admin_note text,
  created_at timestamp NOT NULL DEFAULT now(),
  reviewed_at timestamp,
  reviewed_by varchar(128),
  resulting_member_id integer,
  resulting_org_id integer
);

-- ── Auth tokens ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_tokens (
  id serial PRIMARY KEY,
  member_id integer NOT NULL,
  token_hash varchar(128) NOT NULL UNIQUE,
  purpose varchar(32) NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_auth_tokens_member" ON auth_tokens (member_id);

-- ── Org invites ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_invites (
  id serial PRIMARY KEY,
  organization_id integer NOT NULL,
  email varchar(320) NOT NULL,
  role varchar(32) NOT NULL DEFAULT 'member',
  token_hash varchar(128) NOT NULL UNIQUE,
  status varchar(32) NOT NULL DEFAULT 'pending',
  expires_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- ── Auth events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_events (
  id serial PRIMARY KEY,
  member_id integer,
  type varchar(64) NOT NULL,
  meta jsonb,
  created_at timestamp NOT NULL DEFAULT now()
);
