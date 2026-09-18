"""OpenAlex institutions adapter (dev plan Tier 3: aggregators).

Important limitation, and the reason this is a Tier 3 source rather than
the whole pipeline: OpenAlex is a *scholarly works* graph. Its Institution
objects give you identity data -- official name, country, city, homepage,
whether it's classified as an education institution -- but nothing about
tuition, programs, or scholarships. Those have to come from a Tier 4
source (the institution's own site) or Tier 2 government portals. This
adapter is meant to seed the identity/existence layer that other adapters
then enrich, not to produce publish-ready records on its own -- and
quality.score_completeness() will correctly score these low until
something else fills in the financial fields.

As of February 2026, OpenAlex requires a free API key for all requests
(previously optional) -- see https://openalex.org/settings/api to get one.
"""

from __future__ import annotations

import os
import time
from typing import Iterator

import httpx

from .base import RawCandidate, SourceAdapter

API_BASE = "https://api.openalex.org/institutions"

# ISO 3166-1 alpha-2 codes for the dev plan's Phase 1 target countries
# (dev plan Chapter 1). OpenAlex filters by country_code, not display name.
COUNTRY_CODES: dict[str, str] = {
    "United Kingdom": "GB",
    "Germany": "DE",
    "Turkey": "TR",
    "Poland": "PL",
    "Lithuania": "LT",
    "Malaysia": "MY",
    "Egypt": "EG",
    "Lebanon": "LB",
    "Jordan": "JO",
    "United Arab Emirates": "AE",
}


class OpenAlexAdapter(SourceAdapter):
    name = "openalex"

    def __init__(self, api_key: str | None = None, client: httpx.Client | None = None, request_delay: float = 0.2):
        self.api_key = api_key or os.environ.get("OPENALEX_API_KEY")
        if not self.api_key:
            raise RuntimeError(
                "OPENALEX_API_KEY is required (OpenAlex has required a key for "
                "all requests since Feb 2026). Get a free one at "
                "https://openalex.org/settings/api"
            )
        # Accepting an injected client is what makes this testable without
        # any real network access (see tests/test_openalex_adapter.py).
        self._client = client or httpx.Client(timeout=30.0)
        self._request_delay = request_delay

    def fetch_candidates(self, countries: list[str]) -> Iterator[RawCandidate]:
        for country in countries:
            code = COUNTRY_CODES.get(country)
            if not code:
                raise ValueError(
                    f"No OpenAlex country_code mapping for {country!r}. "
                    f"Known countries: {sorted(COUNTRY_CODES)}"
                )
            yield from self._fetch_country(country, code)

    def _fetch_country(self, country_display_name: str, country_code: str) -> Iterator[RawCandidate]:
        cursor = "*"
        while cursor:
            params = {
                "filter": f"country_code:{country_code},type:education",
                "per_page": 100,
                "cursor": cursor,
                "api_key": self.api_key,
                "select": "id,display_name,homepage_url,geo,type,ror",
            }
            resp = self._client.get(API_BASE, params=params)
            resp.raise_for_status()
            body = resp.json()

            for institution in body.get("results", []):
                yield self._to_candidate(institution, country_display_name)

            cursor = body.get("meta", {}).get("next_cursor")
            if cursor:
                time.sleep(self._request_delay)

    @staticmethod
    def _to_candidate(institution: dict, country_display_name: str) -> RawCandidate:
        geo = institution.get("geo") or {}
        candidate: RawCandidate = {
            "name": institution.get("display_name", ""),
            "country": country_display_name,
            "source_record_id": institution.get("id", ""),
        }
        if geo.get("city"):
            candidate["city"] = geo["city"]
        if institution.get("homepage_url"):
            candidate["website"] = institution["homepage_url"]
        return candidate
