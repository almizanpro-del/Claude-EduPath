-- Migration 003: Scraped university staging table
--
-- The scraping pipeline (scraper/) should never write directly into the
-- live `universities` table -- Chapter 5 of the dev plan is explicit that
-- scraped records need editorial review before publication, and a bad
-- scrape (wrong tuition, mismatched country, a parser bug) landing
-- straight on a public page is a real trust problem for a platform whose
-- whole pitch is trustworthy data.
--
-- This table is the landing zone. The pipeline upserts here; a human
-- reviews and promotes into `universities` (that promotion step, and the
-- admin UI for it, is intentionally not built yet -- see scraper/README.md
-- for what's next).

CREATE TABLE IF NOT EXISTS scraped_universities (
  id BIGSERIAL PRIMARY KEY,

  -- Identity used for deduplication across sources and re-scrapes.
  source VARCHAR(100) NOT NULL,        -- e.g. 'openalex', 'daad'
  source_record_id TEXT,               -- the source's own ID for this record, if it has one
  normalized_name TEXT NOT NULL,       -- output of scraper/normalize.py normalize_name()
  country VARCHAR(100) NOT NULL,

  -- The record as the pipeline produced it. Kept as JSONB rather than
  -- individual columns because different sources surface different fields,
  -- and reshaping this into the real `universities` schema is a manual
  -- editorial decision, not something to force at scrape time.
  raw_data JSONB NOT NULL,

  -- 0-100, see scraper/quality.py score_completeness(). Drives editorial
  -- prioritization per the dev plan (Chapter 5.4): <60 needs attention,
  -- <30 gets auto-rejected before it even reaches a human.
  quality_score INT NOT NULL CHECK (quality_score BETWEEN 0 AND 100),

  -- If this record fuzzy-matched an existing scraped_universities row
  -- above the dedup threshold, that row's id goes here instead of creating
  -- a duplicate entry for editorial review.
  duplicate_of_id BIGINT REFERENCES scraped_universities(id),

  review_status VARCHAR(20) NOT NULL DEFAULT 'pending_review'
    CHECK (review_status IN ('pending_review', 'auto_rejected', 'promoted', 'rejected')),

  -- Set once a human (or a future promote-to-live admin action) links this
  -- to the real row it became.
  promoted_university_id UUID REFERENCES universities(id),

  scraped_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE (source, normalized_name, country)
);

CREATE INDEX IF NOT EXISTS idx_scraped_universities_review_status
  ON scraped_universities(review_status, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_scraped_universities_normalized_name
  ON scraped_universities(normalized_name);

ALTER TABLE scraped_universities ENABLE ROW LEVEL SECURITY;
-- Deliberately zero RLS policies: scraped candidate data (including
-- unreviewed, possibly-wrong records) should never be readable by the
-- public. The pipeline writes via the service-role client; a future admin
-- review UI reads/writes the same way, behind the same admin-auth check
-- used by the review moderation routes (lib/admin-auth.ts).
