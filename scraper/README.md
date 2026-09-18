# EduPath university data scraping pipeline

Implements the dev plan's Chapter 5 pipeline: fetch candidate universities
from a source, normalize and deduplicate, score for completeness, and land
them in a staging table for editorial review. **Nothing in this pipeline
writes to the live `universities` table** — see
`migrations/003_scraped_universities_staging.sql` for why, and "What's
not built yet" below for the missing piece that closes that loop.

## What's actually working right now

- `normalize.py` — name normalization + RapidFuzz-based dedup matching
  (dev plan 5.3). Real, tested, no external dependencies at runtime.
- `quality.py` — 0-100 completeness scoring (dev plan 5.4). Real, tested.
- `adapters/openalex.py` — a working Tier 3 (aggregator) adapter against
  the real OpenAlex Institutions API. Tested against a mocked HTTP
  transport (no live network needed to run the tests).
- `writer.py` / `pipeline.py` — ties the above together and upserts into
  `scraped_universities` via the Supabase service-role client.

Run the tests:
```bash
cd scraper
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests/ -v
```
All 17 tests pass as of this writing — normalization edge cases
(whitespace, punctuation, apostrophes, legal-suffix stripping), dedup
scoring bands (exact / fuzzy-review / no-match / cross-country), quality
scoring, and the OpenAlex adapter's pagination and field mapping.

## An important, deliberate limitation: OpenAlex alone isn't enough

OpenAlex is a **scholarly works graph**. Its Institution records give you
identity data — official name, country, city, homepage URL — but nothing
about tuition, programs, or scholarships. Run the pipeline against
OpenAlex today and every candidate will score around 5/100 and land in
`auto_rejected` (see `quality.py`'s weights: tuition + living cost +
programs are 55 of the 100 points, and OpenAlex supplies none of them).
This is correct, expected behavior, not a bug — OpenAlex is meant to seed
the identity layer that a Tier 2 (government portal) or Tier 4
(university's own site) source then enriches. Ingesting a second source
and merging by `(source, normalized_name, country)` is the natural next
step, not a fix to this one.

## Running it for real

```bash
export OPENALEX_API_KEY=...       # free key: https://openalex.org/settings/api
export NEXT_PUBLIC_SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...   # NOT the anon key -- see writer.py

# See what it would find without writing anything:
python -m scraper.pipeline --source openalex --countries Jordan,Egypt --dry-run

# Actually upsert into scraped_universities:
python -m scraper.pipeline --source openalex --countries Jordan,Egypt
```

Note (Feb 2026): OpenAlex switched from a fully keyless API to requiring a
free API key for all requests. The original dev plan assumed it was
keyless — this adapter reflects the current requirement.

## What's not built yet

- **A second adapter with real financial data.** `adapters/base.py`
  defines the interface; `openalex.py` is the only implementation. A DAAD
  (Germany, Tier 2) or a specific university-site adapter using
  `fetcher.py`'s Playwright-based fetcher is the natural next one to
  write — and the highest-value one, since it's what would actually let
  records clear the `auto_rejected` threshold.
- **`fetcher.py` is untested.** It mirrors the dev plan's own skeleton
  (per-host rate limiting, R2 archival) but Playwright needs to download
  browser binaries from a CDN outside this sandbox's network allowlist,
  and there's no live network access to arbitrary university sites either.
  Smoke-test it against a real target (`playwright install chromium`
  first) before relying on it.
- **The admin promotion UI.** `scraped_universities` rows sit in
  `pending_review` / `needs_attention` / `auto_rejected` forever right
  now — there's no admin page (yet) to review a candidate and promote it
  into the live `universities` table, the way `/admin/reviews` does for
  review moderation. That's the natural next piece: same pattern
  (service-role backend route + `lib/admin-auth.ts`-style authorization
  check), applied to this table instead.
- **Weekly incremental refresh / 90-day full re-scrape** (dev plan 5.4) —
  no scheduling is wired up yet. Once a second adapter exists, this would
  be a Vercel Cron route calling the pipeline, similar in shape to
  `app/api/cron/refresh-fx`.
- **Tier 1/2 sources** (QS, Times HE, DAAD, Campus France, etc.) —
  intentionally out of scope for this pass. Several require paid API
  access or per-source HTML parsing that needs to be built and tested
  against the real site, not assumed.
