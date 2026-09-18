"""CLI entry point for the scraping pipeline.

Usage:
    python -m scraper.pipeline --source openalex --countries Jordan,Egypt

Runs one adapter, scores and normalizes every candidate it yields, and
upserts into the scraped_universities staging table. Does not touch the
live `universities` table -- see migrations/003 and scraper/README.md.
"""

from __future__ import annotations

import argparse
import sys

from .adapters.base import SourceAdapter
from .adapters.openalex import OpenAlexAdapter
from .quality import review_bucket, score_completeness
from .writer import get_client, upsert_candidate

ADAPTERS: dict[str, type[SourceAdapter]] = {
    "openalex": OpenAlexAdapter,
}


def run(source_name: str, countries: list[str], dry_run: bool = False) -> int:
    if source_name not in ADAPTERS:
        print(f"Unknown source {source_name!r}. Available: {sorted(ADAPTERS)}", file=sys.stderr)
        return 1

    adapter = ADAPTERS[source_name]()
    client = None if dry_run else get_client()

    counts = {"ready_for_review": 0, "needs_attention": 0, "auto_rejected": 0}
    for candidate in adapter.fetch_candidates(countries):
        score = score_completeness(candidate)
        bucket = review_bucket(score)
        counts[bucket] += 1

        if dry_run:
            print(f"[{bucket:>15}] score={score:3d}  {candidate.get('name')} ({candidate.get('country')})")
        else:
            upsert_candidate(client, source_name, candidate)

    print(
        f"\n{sum(counts.values())} candidates processed: "
        f"{counts['ready_for_review']} ready for review, "
        f"{counts['needs_attention']} need attention, "
        f"{counts['auto_rejected']} auto-rejected."
    )
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, choices=sorted(ADAPTERS), help="Which adapter to run")
    parser.add_argument("--countries", required=True, help="Comma-separated country names, e.g. Jordan,Egypt")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print results instead of writing to Supabase (no credentials required)",
    )
    args = parser.parse_args()

    countries = [c.strip() for c in args.countries.split(",") if c.strip()]
    sys.exit(run(args.source, countries, dry_run=args.dry_run))


if __name__ == "__main__":
    main()
