-- Allow members to hide sessions from homepage marquee.
-- Safe and idempotent for production Supabase projects.

ALTER TABLE IF EXISTS public.sessions
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

UPDATE public.sessions
SET is_public = true
WHERE is_public IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_is_public_created
  ON public.sessions (is_public, created_at DESC);
