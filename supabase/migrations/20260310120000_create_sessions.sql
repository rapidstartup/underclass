-- Underclass session storage table
-- Safe for existing production databases: only creates missing objects.

CREATE TABLE IF NOT EXISTS public.sessions (
  id text PRIMARY KEY,
  linkedin_url text NOT NULL,
  person_name text,
  profile_data jsonb,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_pul integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_created
  ON public.sessions (created_at DESC);
