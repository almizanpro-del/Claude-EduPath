"""Completeness scoring for a normalized university record.

Per dev plan 5.4: records score 0-100 based on presence of key fields.
Below 60 gets flagged for editorial attention; below 30 is auto-rejected
before it ever reaches a human reviewer.
"""

from __future__ import annotations

from typing import Any

AUTO_REJECT_BELOW = 30
NEEDS_ATTENTION_BELOW = 60

# Field name -> point value. Chosen so that tuition, living cost, and at
# least one program are the highest-value single facts (a listing without
# a price is close to useless to a student comparing options), while the
# rest fill out the remaining budget in roughly the order the dev plan
# lists them. Weights sum to 100.
_FIELD_WEIGHTS: dict[str, int] = {
    "tuition_usd": 20,
    "living_cost_usd": 15,
    "programs": 20,  # non-empty list
    "scholarships": 10,  # non-empty list, may legitimately be empty -> partial credit handled below
    "deadlines": 10,  # at least one program/scholarship with a deadline
    "language_requirements": 10,
    "intl_student_pct": 10,
    "website": 5,
}


def _has_value(record: dict[str, Any], field: str) -> bool:
    value = record.get(field)
    if value is None:
        return False
    if isinstance(value, (list, dict, str)) and len(value) == 0:
        return False
    return True


def score_completeness(record: dict[str, Any]) -> int:
    """Score a normalized record dict from 0-100.

    `record` is expected to use the same field names as _FIELD_WEIGHTS
    (see adapters/base.py for the shape adapters should produce). Missing
    or unrecognized fields simply score zero for that component rather
    than raising -- a scraper source that can't provide a field is exactly
    the case this function exists to flag, not an error.
    """
    score = 0
    for field, weight in _FIELD_WEIGHTS.items():
        if field == "scholarships":
            # Distinguish "known to have none" (empty list -- half credit,
            # we at least checked) from "unknown" (key absent entirely --
            # no credit, same as any other missing field).
            if field not in record:
                continue
            score += weight if _has_value(record, field) else weight // 2
        elif _has_value(record, field):
            score += weight
    return min(score, 100)


def review_bucket(score: int) -> str:
    """Human-readable bucket matching the dev plan's thresholds."""
    if score < AUTO_REJECT_BELOW:
        return "auto_rejected"
    if score < NEEDS_ATTENTION_BELOW:
        return "needs_attention"
    return "ready_for_review"
