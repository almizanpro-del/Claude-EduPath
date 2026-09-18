"""Base interface for a scraper source adapter.

Each source (OpenAlex, a government portal, a university's own site) gets
one adapter implementing `fetch_candidates`. The pipeline (pipeline.py)
doesn't know or care whether a given adapter hits a JSON API or renders a
page with Playwright -- it just calls fetch_candidates and normalizes
whatever comes back.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Iterator, TypedDict


class RawCandidate(TypedDict, total=False):
    """The common shape every adapter should produce, before normalization.

    Adapters should fill in whatever fields their source actually has and
    simply omit the rest -- quality.score_completeness() is designed to
    handle partial records, that's the whole point of the scoring system.
    """

    name: str
    country: str
    city: str
    website: str
    tuition_usd: float
    living_cost_usd: float
    intl_student_pct: float
    programs: list[dict[str, Any]]
    scholarships: list[dict[str, Any]]
    deadlines: list[str]
    language_requirements: str
    source_record_id: str


class SourceAdapter(ABC):
    """One data source in the pipeline's 5-tier source model (dev plan 5.1)."""

    #: Short machine name used as the `source` column in scraped_universities.
    name: str

    @abstractmethod
    def fetch_candidates(self, countries: list[str]) -> Iterator[RawCandidate]:
        """Yield raw candidate records for the given countries.

        Countries are ISO-ish display names matching what the rest of the
        app uses (e.g. "Jordan", "Turkey"), not codes -- adapters are
        responsible for translating to whatever their source expects.
        """
        raise NotImplementedError
