-- Migration 002: FX rate cache + admin audit log
--
-- Problem this fixes:
-- 1. The cost calculator (app/calculator/page.tsx) uses hardcoded currency
--    conversion rates baked into the client bundle. They're already stale
--    the moment they're deployed and will silently drift further out of
--    date forever with no way to refresh them short of a code change.
-- 2. The admin review-approval queue (added previously) performs a real,
--    consequential action -- publishing or rejecting someone's review --
--    with zero record of who did it or when. There's no way to audit a
--    disputed moderation decision.
--
-- Run this in the Supabase SQL editor (or via your migrations workflow).

-- 1. FX rate cache. One row per (base, quote) pair, overwritten on refresh
--    -- we only need the latest rate for the calculator, not a full history,
--    so this uses an upsert-friendly unique constraint rather than an
--    append-only log.
CREATE TABLE IF NOT EXISTS fx_rates (
  id BIGSERIAL PRIMARY KEY,
  base VARCHAR(3) NOT NULL,
  quote VARCHAR(3) NOT NULL,
  rate DECIMAL(18, 6) NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
  source VARCHAR(100) NOT NULL,
  UNIQUE (base, quote)
);

CREATE INDEX IF NOT EXISTS idx_fx_rates_base_quote ON fx_rates(base, quote);

ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;

-- Rates are non-sensitive public data the calculator needs to read as an
-- anonymous visitor -- no auth required to browse the site.
CREATE POLICY "FX rates are public" ON fx_rates
  FOR SELECT USING (true);

-- No INSERT/UPDATE policy is defined for fx_rates on purpose: with RLS
-- enabled and no policy granting writes, every role except service_role
-- (which bypasses RLS) is blocked from writing. Only the cron refresh
-- route (using the service-role client) can update rates.

-- 2. Admin audit log. Append-only, service-role-only (no RLS policies grant
--    any access at all -- admins view it through a trusted backend route,
--    not directly via the client).
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- e.g. 'review.approve', 'review.reject'
  entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL,
  before JSONB,
  after JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
-- Deliberately zero policies: RLS enabled + no policies means nobody using
-- the anon or authenticated role can read or write this table at all, from
-- any client. Only the service-role client (used server-side in the admin
-- API routes) can touch it.
