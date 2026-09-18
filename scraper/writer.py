"""Writes scored candidates into Supabase's scraped_universities staging
table. Never writes to the live `universities` table -- see migrations/
003_scraped_universities_staging.sql for why.
"""

from __future__ import annotations

import os
from typing import Any

from supabase import Client, create_client

from .normalize import normalize_name
from .quality import AUTO_REJECT_BELOW, score_completeness


def get_client() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    # Deliberately the service-role key, not the anon key: RLS on
    # scraped_universities grants zero access to anon/authenticated by
    # design (see the migration), so this table is only reachable this way.
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
            "(same values as the Next.js app's Vercel environment)."
        )
    return create_client(url, key)


def upsert_candidate(client: Client, source: str, candidate: dict[str, Any]) -> dict:
    """Score, normalize, and upsert one candidate record.

    Returns the row as written (including whatever review_status it landed
    in). Uses the (source, normalized_name, country) unique constraint to
    upsert -- re-running the pipeline updates existing pending candidates
    with fresher data rather than creating duplicates.
    """
    name = candidate.get("name", "")
    country = candidate.get("country", "")
    if not name or not country:
        raise ValueError(f"Candidate missing name or country: {candidate!r}")

    score = score_completeness(candidate)
    review_status = "auto_rejected" if score < AUTO_REJECT_BELOW else "pending_review"

    row = {
        "source": source,
        "source_record_id": candidate.get("source_record_id"),
        "normalized_name": normalize_name(name),
        "country": country,
        "raw_data": candidate,
        "quality_score": score,
        "review_status": review_status,
    }

    result = (
        client.table("scraped_universities")
        .upsert(row, on_conflict="source,normalized_name,country")
        .execute()
    )
    return result.data[0] if result.data else row
