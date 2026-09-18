"""Normalization and deduplication for scraped university records.

Two sources rarely spell a name the same way ("University of Amman" vs
"Amman University" vs "AMMAN UNIV."), so records are matched on a
normalized name + country key first (exact), then a fuzzy-match pass
(RapidFuzz token_sort_ratio) for near-duplicates that don't normalize to
exactly the same string.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from rapidfuzz import fuzz

# Below this score, two names are considered unrelated.
FUZZY_MATCH_THRESHOLD = 92
# Between this and FUZZY_MATCH_THRESHOLD, flag for manual review rather than
# auto-merging or treating as distinct (per dev plan 5.3: 80-92 = manual review).
FUZZY_REVIEW_THRESHOLD = 80

_LEGAL_SUFFIX_RE = re.compile(r"\b(university of|university|univ\.?)\b")
_APOSTROPHE_RE = re.compile(r"['\u2019]")  # delete: "joseph's" -> "josephs", not "joseph s"
_OTHER_PUNCTUATION_RE = re.compile(r"[^a-z0-9\s]")  # replace with space
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_name(name: str) -> str:
    """Canonicalize a university name for matching.

    Lowercases, strips common legal-entity phrasing ("University of X" /
    "X University" both become "x"), removes punctuation, and collapses
    whitespace. This intentionally throws away information (it's a
    matching key, not a display name) -- always keep the original name in
    raw_data for display/editorial purposes.
    """
    if not name:
        return ""
    s = name.lower().strip()
    # Collapse internal whitespace BEFORE stripping "university of" --
    # otherwise irregular spacing ("university   of") breaks the two-word
    # alternative's literal single-space match and only "university" gets
    # stripped, leaving a stray "of" behind.
    s = _WHITESPACE_RE.sub(" ", s)
    s = _LEGAL_SUFFIX_RE.sub(" ", s)
    s = _APOSTROPHE_RE.sub("", s)
    # Replace (not delete) remaining punctuation, so e.g. "German-Jordanian"
    # doesn't collapse into "germanjordanian" and silently become a
    # different token for fuzzy matching purposes.
    s = _OTHER_PUNCTUATION_RE.sub(" ", s)
    s = _WHITESPACE_RE.sub(" ", s)
    return s.strip()


@dataclass(frozen=True)
class DedupMatch:
    """A candidate match found in an existing set of records."""

    existing_index: int
    score: float
    is_review_needed: bool  # True if score is in the manual-review band


def find_duplicates(
    new_name: str,
    new_country: str,
    existing: list[tuple[str, str]],
    threshold: int = FUZZY_MATCH_THRESHOLD,
    review_threshold: int = FUZZY_REVIEW_THRESHOLD,
) -> list[DedupMatch]:
    """Find existing (name, country) records that plausibly match.

    `existing` is a list of (name, country) tuples in their *original*
    (non-normalized) form -- normalization happens inside this function so
    callers don't have to remember to do it consistently.

    Two-pass strategy per dev plan 5.3: exact match on normalized
    name+country scores as a perfect match (100); everything else is
    scored by fuzzy token_sort_ratio on the normalized name, restricted to
    the same country (a fuzzy name match across different countries is
    almost always a false positive -- e.g. "American University" exists in
    multiple countries as genuinely distinct institutions).
    """
    new_key = normalize_name(new_name)
    new_country_norm = new_country.strip().lower()

    matches: list[DedupMatch] = []
    for i, (existing_name, existing_country) in enumerate(existing):
        if existing_country.strip().lower() != new_country_norm:
            continue

        existing_key = normalize_name(existing_name)
        if not existing_key or not new_key:
            continue

        score = 100.0 if existing_key == new_key else fuzz.token_sort_ratio(new_key, existing_key)

        if score >= review_threshold:
            matches.append(
                DedupMatch(
                    existing_index=i,
                    score=score,
                    is_review_needed=score < threshold,
                )
            )

    return sorted(matches, key=lambda m: -m.score)
