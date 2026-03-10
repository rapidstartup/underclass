-- Member access + lead capture support for ReplaceProof paywall rebrand.
-- Idempotent and safe to run on production Supabase projects.

ALTER TABLE IF EXISTS public.sessions
  ADD COLUMN IF NOT EXISTS member_email text,
  ADD COLUMN IF NOT EXISTS member_id text,
  ADD COLUMN IF NOT EXISTS access_unlocked_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_source text,
  ADD COLUMN IF NOT EXISTS lead_name text,
  ADD COLUMN IF NOT EXISTS lead_email text,
  ADD COLUMN IF NOT EXISTS upgrade_intent text,
  ADD COLUMN IF NOT EXISTS upgrade_prompted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_sessions_member_email
  ON public.sessions (member_email);

CREATE INDEX IF NOT EXISTS idx_sessions_member_id
  ON public.sessions (member_id);

CREATE INDEX IF NOT EXISTS idx_sessions_lead_email
  ON public.sessions (lead_email);

CREATE TABLE IF NOT EXISTS public.member_unlocks (
  unlock_key text PRIMARY KEY,
  member_id text,
  member_email text,
  member_name text,
  access_source text NOT NULL DEFAULT 'webhook',
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  last_event_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_unlocks_member_email
  ON public.member_unlocks (member_email);

CREATE INDEX IF NOT EXISTS idx_member_unlocks_member_id
  ON public.member_unlocks (member_id);

CREATE TABLE IF NOT EXISTS public.member_webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_id text UNIQUE,
  source text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
