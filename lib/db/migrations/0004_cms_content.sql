-- 0004_cms_content.sql
-- Public marketing / Learn content tables (articles, resources, podcasts, etc.)
-- Safe to re-run: CREATE IF NOT EXISTS.
-- Source of truth: lib/db/src/schema/schema.ts (Drizzle). Primary apply remains
--   pnpm --filter @workspace/db run push

CREATE TABLE IF NOT EXISTS articles (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  linkedin_url text NOT NULL,
  publish_date bigint NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  pdf_url text
);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS resources (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  description text,
  file_url varchar NOT NULL,
  category varchar NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS podcasts (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  description text,
  episode_number integer,
  audio_url varchar,
  publish_date timestamp NOT NULL DEFAULT now(),
  duration varchar,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id serial PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  company text NOT NULL,
  quote text NOT NULL,
  outcome text NOT NULL,
  category text NOT NULL DEFAULT 'individual',
  featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_studies (
  id serial PRIMARY KEY,
  title text NOT NULL,
  client_label text NOT NULL,
  challenge text NOT NULL,
  solution text NOT NULL,
  results text[] NOT NULL,
  category text NOT NULL DEFAULT 'individual',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inquiries (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  company text,
  service_type text,
  message text NOT NULL,
  submitted_at bigint NOT NULL,
  is_read boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  subscribed_at bigint NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS resource_leads (
  id serial PRIMARY KEY,
  name varchar NOT NULL,
  email text NOT NULL,
  resource_id integer NOT NULL,
  resource_title varchar NOT NULL,
  captured_at timestamp DEFAULT now()
);
