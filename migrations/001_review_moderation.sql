-- Migration 001: Review moderation gate
--
-- Problem this fixes:
-- 1. Reviews were only ever created with is_verified = false, and there was
--    no admin path to flip it to true — so no review could ever appear,
--    even though the submit flow "worked". This adds a real moderation
--    field an admin can actually set.
-- 2. The old RLS policy ("Anyone can read reviews" USING (true)) exposed
--    every review, verified or not, to anyone hitting the API directly with
--    the anon key. The app only *looked* safe because the client code
--    happened to filter on is_verified — that's not a DB-level guarantee.
--    This migration makes the gate a real Postgres constraint via RLS.
--
-- Run this in the Supabase SQL editor (or `supabase db push` if you're using
-- the CLI/migrations workflow).

-- 1. Add the moderation_status column.
--    Existing rows default to 'pending' by definition, but since this repo
--    doesn't have real production review data yet, we don't need a special
--    backfill case. If you already have real reviews you want to keep
--    visible, run:
--      UPDATE reviews SET moderation_status = 'approved' WHERE is_verified = true;
--    before applying the NOT NULL constraint below.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON reviews(university_id, moderation_status);

-- 2. Replace the old "anyone can read everything" policy with one that only
--    exposes approved reviews publicly, plus a user's own (not-yet-approved)
--    reviews to themselves.
DROP POLICY IF EXISTS "Anyone can read reviews" ON reviews;

CREATE POLICY "Approved reviews are public, own reviews visible to author"
  ON reviews FOR SELECT
  USING (moderation_status = 'approved' OR auth.uid() = user_id);

-- 3. Tighten the insert policy so a user can only ever insert a review in
--    'pending' state for themselves — they cannot self-approve by crafting
--    a raw API call with moderation_status = 'approved'.
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;

CREATE POLICY "Users can create pending reviews for themselves"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND moderation_status = 'pending');

-- 4. The existing "Users can update their own reviews" policy lets an
--    author edit their own review text/ratings. Without a separate check,
--    that same policy would let them flip moderation_status back to
--    'approved' themselves via a raw API call. RLS's WITH CHECK can't
--    reliably compare "old vs new" for a single column mid-UPDATE, so the
--    correct tool here is a BEFORE UPDATE trigger: it has real OLD/NEW
--    access and rejects the write outright if a non-admin tries to change
--    moderation_status.
CREATE OR REPLACE FUNCTION reject_moderation_status_change_by_non_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status THEN
    -- service_role (our admin API route) bypasses RLS but NOT triggers, and
    -- has no auth.uid() since it isn't a logged-in user's JWT -- it's a
    -- trusted backend context by definition, so allow it. Anything else
    -- must be an authenticated admin's own uid.
    IF auth.role() != 'service_role'
       AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.is_admin = true) THEN
      RAISE EXCEPTION 'Only admins can change a review''s moderation_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_moderation_status ON reviews;

CREATE TRIGGER trg_protect_moderation_status
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION reject_moderation_status_change_by_non_admin();

-- The pre-existing "Users can update their own reviews" policy
-- (USING (auth.uid() = user_id)) stays as-is for content edits; the
-- trigger above is what stops it from being used to self-approve.
-- Admins moderate through the admin console using the service role key
-- (which bypasses RLS entirely), so no separate admin RLS policy is
-- needed for this pass.
