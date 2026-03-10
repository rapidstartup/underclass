-- Enable Row Level Security on app data tables.
-- Safe and idempotent for production databases.

ALTER TABLE IF EXISTS public.sessions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.member_unlocks
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.member_webhook_events
  ENABLE ROW LEVEL SECURITY;
